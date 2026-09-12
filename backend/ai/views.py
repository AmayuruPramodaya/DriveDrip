from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .ai_utils import generate_text_from_prompt
from rest_framework.response import Response
from rating.models import Review, Rating
from datetime import timezone, timedelta
from django.db.models import Count, Q
from parts.models import SparePart
from rest_framework import status
from order.models import Order
from shop.models import Shop
from main.models import User

# Create your views here.


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_part_description(request):
    """
    Generates a product description for a spare part using AI.
    """
    part_name = request.data.get("name", "")
    part_number = request.data.get("part_number", "")
    condition = request.data.get("condition", "")
    # You could also pass in compatible vehicle info for a better description

    if not part_name:
        return Response(
            {"error": "Part name is required to generate a description."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    prompt = (
        f"Generate a professional and appealing product description for a vehicle spare part. "
        f"The product is a '{part_name}' (Part Number: {part_number if part_number else 'N/A'}) "
        f"in '{condition}' condition. "
        f"The description should be helpful for a car owner or mechanic looking to buy this part. "
        f"Highlight its benefits, quality, and typical use case. Format it with a short introduction, "
        f"a bulleted list of key features, and a concluding sentence. Do not use markdown."
    )

    generated_description = generate_text_from_prompt(prompt)

    if generated_description:
        return Response({"description": generated_description})
    else:
        return Response(
            {"error": "Could not generate description at this time."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])  # Anyone can view a summary
def summarize_reviews(request, part_id):
    """
    Summarizes all reviews for a given spare part.
    """
    try:
        part = SparePart.objects.get(pk=part_id)
        reviews = Review.objects.filter(reviewed_spare_part=part)

        if reviews.count() < 3:  # Only summarize if there are enough reviews
            return Response(
                {"summary": "Not enough reviews to generate a summary."},
                status=status.HTTP_200_OK,
            )

        review_texts = "\n".join([f"- {r.content}" for r in reviews])

        prompt = (
            f"You are a helpful assistant for an auto parts website. "
            f"Summarize the following customer reviews for the product '{part.name}'. "
            f"Based on all the reviews, provide an overall summary in one paragraph. "
            f"Then, list the top 3 common 'Pros' and top 3 common 'Cons' in bullet points. "
            f"If you cannot find 3 pros or cons, list as many as you can find. "
            f"If there are no clear cons, state that. The response should be in JSON format with keys 'overall_summary', 'pros', and 'cons'.\n\n"
            f"Here are the reviews:\n{review_texts}"
        )

        summary_json_str = generate_text_from_prompt(prompt)
        # Clean up the response from Gemini to ensure it's valid JSON
        summary_json_str = (
            summary_json_str.strip().replace("```json", "").replace("```", "")
        )

        import json

        summary_data = json.loads(summary_json_str)

        return Response(summary_data)

    except SparePart.DoesNotExist:
        return Response({"error": "Part not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": f"Could not generate summary: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analyze_seller_reputation(request, seller_id):
    """
    AI-powered seller reputation analysis for admin use.
    Analyzes reviews, part descriptions, order history, and behavior patterns.
    """
    # Check if user is admin/staff
    if not request.user.is_staff:
        return Response(
            {"error": "Only admin users can access seller reputation analysis."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        seller = User.objects.get(id=seller_id, role="SELLER")

        # Gather seller data
        shops = Shop.objects.filter(seller=seller)
        spare_parts = SparePart.objects.filter(seller=seller)
        reviews_received = Review.objects.filter(reviewed_shop__in=shops)
        ratings_received = Rating.objects.filter(rated_shop__in=shops)
        orders_involving_seller = Order.objects.filter(
            items__spare_part__seller=seller
        ).distinct()

        # Prepare data for AI analysis
        analysis_data = {
            "seller_info": {
                "username": seller.username,
                "name": seller.name,
                "join_date": seller.date_joined.strftime("%Y-%m-%d"),
                "average_rating": seller.average_rating,
                "total_ratings": seller.total_ratings,
            },
            "business_metrics": {
                "total_shops": shops.count(),
                "total_spare_parts": spare_parts.count(),
                "total_orders": orders_involving_seller.count(),
                "active_parts": spare_parts.filter(is_active=True).count(),
            },
            "reviews_sample": [
                {
                    "content": review.content,
                    "rating": (
                        getattr(review.rating, "rating", 0) if review.rating else 0
                    ),
                    "date": review.created_at.strftime("%Y-%m-%d"),
                }
                for review in reviews_received.order_by("-created_at")[:10]
            ],
            "part_descriptions_sample": [
                {
                    "name": part.name,
                    "description": (
                        part.description[:200] + "..."
                        if len(part.description) > 200
                        else part.description
                    ),
                    "price": float(part.price),
                    "condition": part.condition,
                }
                for part in spare_parts.order_by("-created_at")[:5]
            ],
        }

        # Create AI prompt for comprehensive analysis
        prompt = f"""
        You are an AI assistant for an auto parts marketplace analyzing seller reputation. 
        Analyze the following seller data and provide a comprehensive reputation assessment:

        SELLER PROFILE:
        - Username: {analysis_data['seller_info']['username']}
        - Member since: {analysis_data['seller_info']['join_date']}
        - Average rating: {analysis_data['seller_info']['average_rating']}/5
        - Total ratings: {analysis_data['seller_info']['total_ratings']}

        BUSINESS METRICS:
        - Shops: {analysis_data['business_metrics']['total_shops']}
        - Total parts listed: {analysis_data['business_metrics']['total_spare_parts']}
        - Active parts: {analysis_data['business_metrics']['active_parts']}
        - Orders processed: {analysis_data['business_metrics']['total_orders']}

        RECENT REVIEWS:
        {chr(10).join([f"- Rating: {r['rating']}/5, Review: {r['content']}" for r in analysis_data['reviews_sample'][:5]])}

        PART DESCRIPTIONS SAMPLE:
        {chr(10).join([f"- {p['name']} ({p['condition']}): {p['description']}" for p in analysis_data['part_descriptions_sample'][:3]])}

        Please provide analysis in JSON format with these keys:
        1. "overall_reputation_score": A score from 1-10 (10 being excellent)
        2. "trust_level": "HIGH", "MEDIUM", or "LOW"
        3. "strengths": List of positive aspects
        4. "concerns": List of potential issues or red flags
        5. "recommendations": Suggested actions for admin
        6. "business_health": Assessment of seller's business activity
        7. "customer_satisfaction": Analysis based on reviews and ratings
        8. "detailed_analysis": Comprehensive narrative assessment

        Focus on: Review sentiment, business activity patterns, part description quality, pricing fairness, customer service quality, and any red flags.
        """

        # Get AI analysis
        ai_response = generate_text_from_prompt(prompt)

        if ai_response:
            # Clean and parse AI response
            ai_response = ai_response.strip().replace("```json", "").replace("```", "")

            try:
                import json

                analysis_result = json.loads(ai_response)

                # Add metadata
                analysis_result["analysis_date"] = timezone.now().isoformat()
                analysis_result["seller_id"] = seller_id
                analysis_result["data_points_analyzed"] = {
                    "reviews_count": reviews_received.count(),
                    "ratings_count": ratings_received.count(),
                    "parts_count": spare_parts.count(),
                    "orders_count": orders_involving_seller.count(),
                }

                return Response(analysis_result)

            except json.JSONDecodeError:
                # If JSON parsing fails, return raw analysis
                return Response(
                    {
                        "analysis_date": timezone.now().isoformat(),
                        "seller_id": seller_id,
                        "raw_analysis": ai_response,
                        "error": "Could not parse AI response as JSON",
                    }
                )
        else:
            return Response(
                {"error": "Could not generate seller analysis at this time."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except User.DoesNotExist:
        return Response(
            {"error": "Seller not found."}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Analysis failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bulk_seller_analysis(request):
    """
    Bulk analysis of multiple sellers for admin dashboard.
    Returns summary insights across all sellers.
    """
    if not request.user.is_staff:
        return Response(
            {"error": "Only admin users can access bulk seller analysis."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        # Get all sellers with basic metrics
        sellers = (
            User.objects.filter(role="SELLER")
            .annotate(
                shop_count=Count("shops"),
                part_count=Count("spare_parts"),
                order_count=Count("spare_parts__order_items__order", distinct=True),
            )
            .order_by("-average_rating")
        )

        # Identify top performers and potential issues
        top_performers = sellers.filter(average_rating__gte=4.5, total_ratings__gte=10)[
            :5
        ]
        concerning_sellers = sellers.filter(
            Q(average_rating__lt=3.0) | Q(total_ratings__gte=20, average_rating__lt=3.5)
        )[:5]
        new_sellers = sellers.filter(
            date_joined__gte=timezone.now() - timedelta(days=30)
        )
        inactive_sellers = sellers.filter(
            spare_parts__isnull=True,
            date_joined__lt=timezone.now() - timedelta(days=60),
        )

        # Create summary prompt
        summary_data = {
            "total_sellers": sellers.count(),
            "top_performers": [
                {
                    "username": s.username,
                    "rating": s.average_rating,
                    "total_ratings": s.total_ratings,
                    "shops": s.shop_count,
                    "parts": s.part_count,
                }
                for s in top_performers
            ],
            "concerning_sellers": [
                {
                    "username": s.username,
                    "rating": s.average_rating,
                    "total_ratings": s.total_ratings,
                    "shops": s.shop_count,
                    "parts": s.part_count,
                }
                for s in concerning_sellers
            ],
            "new_sellers_count": new_sellers.count(),
            "inactive_sellers_count": inactive_sellers.count(),
        }

        prompt = f"""
        Analyze this seller ecosystem summary for an auto parts marketplace:

        OVERVIEW:
        - Total sellers: {summary_data['total_sellers']}
        - New sellers (last 30 days): {summary_data['new_sellers_count']}
        - Inactive sellers: {summary_data['inactive_sellers_count']}

        TOP PERFORMERS:
        {chr(10).join([f"- {s['username']}: {s['rating']}/5 ({s['total_ratings']} ratings), {s['shops']} shops, {s['parts']} parts" for s in summary_data['top_performers']])}

        CONCERNING SELLERS:
        {chr(10).join([f"- {s['username']}: {s['rating']}/5 ({s['total_ratings']} ratings), {s['shops']} shops, {s['parts']} parts" for s in summary_data['concerning_sellers']])}

        Provide analysis in JSON format:
        1. "ecosystem_health": Overall health score (1-10)
        2. "key_insights": Main observations about the seller community
        3. "recommended_actions": Actions for marketplace admins
        4. "growth_opportunities": Ways to improve seller performance
        5. "risk_factors": Potential issues to monitor
        """

        ai_response = generate_text_from_prompt(prompt)

        if ai_response:
            ai_response = ai_response.strip().replace("```json", "").replace("```", "")
            try:
                import json

                analysis = json.loads(ai_response)
                analysis.update(summary_data)
                analysis["analysis_date"] = timezone.now().isoformat()
                return Response(analysis)
            except:
                return Response(
                    {
                        **summary_data,
                        "raw_analysis": ai_response,
                        "analysis_date": timezone.now().isoformat(),
                    }
                )

        return Response(summary_data)

    except Exception as e:
        return Response(
            {"error": f"Bulk analysis failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def compatibility_chatbot(request, part_id):
    """
    AI chatbot to answer compatibility questions about spare parts.
    Answers questions like "Will this fit my 2019 Honda Civic?"
    """
    try:
        part = SparePart.objects.get(id=part_id)
        user_question = request.data.get("question", "").strip()

        if not user_question:
            return Response(
                {"error": "Question is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get compatible vehicles for this part
        compatible_vehicles = part.compatible_vehicles.all()

        # Prepare vehicle compatibility data
        compatibility_data = []
        for vehicle in compatible_vehicles:
            compatibility_data.append(
                {
                    "brand": vehicle.brand.name,
                    "model": vehicle.name,
                    "year_from": vehicle.year_from,
                    "year_to": vehicle.year_to,
                    "category": vehicle.brand.category.name,
                }
            )

        # Create AI prompt for compatibility assistant
        prompt = f"""
        You are a helpful automotive compatibility assistant for an auto parts website. 
        A customer is asking about a spare part's compatibility with their vehicle.

        SPARE PART DETAILS:
        - Name: {part.name}
        - Part Number: {part.part_number or 'Not specified'}
        - Category: {part.category.name if part.category else 'Unknown'}
        - Condition: {part.condition}
        - Description: {part.description[:300]}...

        COMPATIBLE VEHICLES:
        {chr(10).join([f"- {v['brand']} {v['model']} ({v['year_from']}-{v['year_to'] or 'present'})" for v in compatibility_data[:20]])}

        CUSTOMER QUESTION: "{user_question}"

        Please provide a helpful, accurate response about compatibility. Include:
        1. Direct answer (Yes/No/Maybe with explanation)
        2. Specific vehicle information if mentioned
        3. Additional compatibility notes or warnings
        4. Suggestion to verify with seller if uncertain

        Respond in a friendly, helpful tone as if you're a knowledgeable parts specialist.
        Keep response concise but informative (maximum 200 words).
        """

        # Get AI response
        ai_response = generate_text_from_prompt(prompt)

        if ai_response:
            # Log the interaction for analytics
            interaction_data = {
                "part_id": part_id,
                "question": user_question,
                "response": ai_response,
                "timestamp": timezone.now().isoformat(),
                "compatible_vehicles_count": len(compatibility_data),
            }

            return Response(
                {
                    "response": ai_response.strip(),
                    "part_name": part.name,
                    "compatible_vehicles_count": len(compatibility_data),
                    "interaction_id": f"chat_{part_id}_{timezone.now().timestamp()}",
                }
            )
        else:
            return Response(
                {
                    "error": "Sorry, I could not process your question at this time. Please contact the seller directly."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except SparePart.DoesNotExist:
        return Response(
            {"error": "Spare part not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Chatbot error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def semantic_search_parts(request):
    """
    AI-powered semantic search for spare parts.
    Understands intent behind search queries like "my car makes grinding noise when I stop"
    """
    query = request.data.get("query", "").strip()

    if not query:
        return Response(
            {"error": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # First, let AI interpret the search intent
        intent_prompt = f"""
        You are an automotive parts specialist AI. A customer searched: "{query}"
        
        Analyze this search query and provide PRECISE automotive part identification in JSON format:
        
        1. "search_intent": Specific automotive system/issue (e.g., "brake system maintenance", "engine starting problem")
        2. "suggested_categories": ONLY directly related part categories (max 2-3)
        3. "suggested_keywords": SPECIFIC part names/terms (max 4-5 most relevant)
        4. "vehicle_type_hints": Any vehicle details mentioned
        5. "urgency_level": "high", "medium", or "low"
        6. "problem_description": Technical issue description
        
        IMPORTANT RULES:
        - Be VERY SPECIFIC - only suggest directly related parts
        - For "grinding noise when braking" → ONLY brake system parts (brake pads, rotors, calipers)
        - For "headlight issues" → ONLY lighting parts (bulbs, assemblies, switches)
        - For "engine won't start" → ONLY starting system parts (battery, starter, ignition)
        - DO NOT mix unrelated automotive systems
        - Focus on the PRIMARY issue mentioned
        
        Examples of GOOD specific responses:
        "grinding noise when braking" → keywords: ["brake pad", "brake rotor", "brake disc"], categories: ["Brake System"]
        "headlight too dim" → keywords: ["headlight bulb", "headlight assembly"], categories: ["Lighting"]
        "car won't start" → keywords: ["battery", "starter motor", "ignition switch"], categories: ["Electrical", "Engine"]
        """

        # Pattern-based search for common automotive issues (more reliable than AI)
        query_lower = query.lower()

        # Brake-related searches
        if any(
            brake_word in query_lower
            for brake_word in ["brake", "braking", "stop", "grinding"]
        ):
            parts = SparePart.objects.filter(
                Q(name__icontains="brake")
                | Q(description__icontains="brake")
                | Q(name__icontains="pad")
                | Q(description__icontains="pad")
                | Q(category__name__icontains="brake"),
                is_active=True,
            ).order_by("-average_rating", "-total_sales")[:10]

            from parts.serializers import SparePartSerializer

            serializer = SparePartSerializer(parts, many=True)

            return Response(
                {
                    "results": serializer.data,
                    "search_query": query,
                    "results_count": parts.count(),
                    "search_type": "brake_specific",
                }
            )

        # Engine/starting issues
        elif any(
            engine_word in query_lower
            for engine_word in ["start", "starting", "engine", "motor", "ignition"]
        ):
            parts = SparePart.objects.filter(
                Q(name__icontains="engine")
                | Q(description__icontains="engine")
                | Q(name__icontains="motor")
                | Q(description__icontains="motor")
                | Q(name__icontains="starter")
                | Q(description__icontains="starter")
                | Q(name__icontains="battery")
                | Q(description__icontains="battery")
                | Q(name__icontains="ignition")
                | Q(description__icontains="ignition")
                | Q(category__name__icontains="engine")
                | Q(category__name__icontains="electrical"),
                is_active=True,
            ).order_by("-average_rating", "-total_sales")[:10]

            from parts.serializers import SparePartSerializer

            serializer = SparePartSerializer(parts, many=True)

            return Response(
                {
                    "results": serializer.data,
                    "search_query": query,
                    "results_count": parts.count(),
                    "search_type": "engine_specific",
                }
            )

        # Lighting issues
        elif any(
            light_word in query_lower
            for light_word in ["light", "headlight", "bulb", "lamp", "dim", "bright"]
        ):
            parts = SparePart.objects.filter(
                Q(name__icontains="light")
                | Q(description__icontains="light")
                | Q(name__icontains="bulb")
                | Q(description__icontains="bulb")
                | Q(name__icontains="lamp")
                | Q(description__icontains="lamp")
                | Q(category__name__icontains="light")
                | Q(category__name__icontains="lighting"),
                is_active=True,
            ).order_by("-average_rating", "-total_sales")[:10]

            from parts.serializers import SparePartSerializer

            serializer = SparePartSerializer(parts, many=True)

            return Response(
                {
                    "results": serializer.data,
                    "search_query": query,
                    "results_count": parts.count(),
                    "search_type": "lighting_specific",
                }
            )

        # Suspension issues
        elif any(
            suspension_word in query_lower
            for suspension_word in [
                "suspension",
                "shock",
                "spring",
                "steering",
                "vibrat",
            ]
        ):
            parts = SparePart.objects.filter(
                Q(name__icontains="suspension")
                | Q(description__icontains="suspension")
                | Q(name__icontains="shock")
                | Q(description__icontains="shock")
                | Q(name__icontains="spring")
                | Q(description__icontains="spring")
                | Q(name__icontains="steering")
                | Q(description__icontains="steering")
                | Q(category__name__icontains="suspension")
                | Q(category__name__icontains="steering"),
                is_active=True,
            ).order_by("-average_rating", "-total_sales")[:10]

            from parts.serializers import SparePartSerializer

            serializer = SparePartSerializer(parts, many=True)

            return Response(
                {
                    "results": serializer.data,
                    "search_query": query,
                    "results_count": parts.count(),
                    "search_type": "suspension_specific",
                }
            )

        # Try AI interpretation for other queries (fallback to AI if patterns don't match)
        ai_intent = generate_text_from_prompt(intent_prompt)

        if not ai_intent:
            # Fallback to regular search
            return regular_search_fallback(query)

        try:
            # Parse AI intent response
            ai_intent = ai_intent.strip().replace("```json", "").replace("```", "")
            import json

            intent_data = json.loads(ai_intent)

            # Build smart search based on AI interpretation
            suggested_keywords = intent_data.get("suggested_keywords", [])
            suggested_categories = intent_data.get("suggested_categories", [])
            search_intent = intent_data.get("search_intent", "")

            # Start with empty queryset for precise search
            parts = SparePart.objects.none()

            # PRIORITIZED SEARCH STRATEGY:
            # 1. First try AI-suggested keywords (most specific)
            ai_keyword_parts = SparePart.objects.none()
            if suggested_keywords:
                ai_search_q = Q()

                for keyword_phrase in suggested_keywords:
                    # Use the full keyword phrase for more precise matching
                    keyword_phrase = keyword_phrase.lower().strip()
                    if len(keyword_phrase) > 2:
                        ai_search_q |= (
                            Q(name__icontains=keyword_phrase)
                            | Q(description__icontains=keyword_phrase)
                            | Q(category__name__icontains=keyword_phrase)
                        )

                        # Also search individual meaningful words in the phrase
                        words = [
                            w
                            for w in keyword_phrase.split()
                            if len(w) > 3
                            and w not in ["part", "parts", "system", "auto", "vehicle"]
                        ]
                        for word in words:
                            ai_search_q |= (
                                Q(name__icontains=word)
                                | Q(description__icontains=word)
                                | Q(category__name__icontains=word)
                            )

                ai_keyword_parts = SparePart.objects.filter(ai_search_q, is_active=True)

            # 2. Category-based search (medium specificity)
            category_parts = SparePart.objects.none()
            if suggested_categories:
                category_q = Q()
                for category in suggested_categories:
                    category = category.lower().strip()
                    if len(category) > 2:
                        category_q |= Q(category__name__icontains=category)

                        # Search category words individually
                        words = [w for w in category.split() if len(w) > 3]
                        for word in words:
                            category_q |= Q(category__name__icontains=word)

                category_parts = SparePart.objects.filter(category_q, is_active=True)

            # 3. Only combine results if AI keyword search found relevant parts
            if ai_keyword_parts.exists():
                parts = ai_keyword_parts
                # Add category parts only if they're related
                if category_parts.exists():
                    parts = (parts | category_parts).distinct()
            elif category_parts.exists():
                # Use category search if no keyword matches
                parts = category_parts
            else:
                # Last resort: search meaningful words from original query BUT be very restrictive
                query_words = query.lower().split()
                meaningful_words = [
                    w
                    for w in query_words
                    if len(w) > 4
                    and w
                    not in [
                        "my",
                        "the",
                        "and",
                        "for",
                        "with",
                        "have",
                        "are",
                        "too",
                        "when",
                        "makes",
                        "noise",
                        "sound",
                        "grinding",
                        "loud",
                    ]
                ]

                if meaningful_words:
                    fallback_q = Q()
                    for word in meaningful_words[
                        :2
                    ]:  # Limit to 2 most meaningful words only
                        fallback_q |= (
                            Q(name__icontains=word)
                            | Q(description__icontains=word)
                            | Q(category__name__icontains=word)
                        )
                    parts = SparePart.objects.filter(fallback_q, is_active=True)

            # Filter out clearly unrelated results based on search intent - MORE AGGRESSIVE
            if parts.exists() and search_intent:
                intent_lower = search_intent.lower()
                original_count = parts.count()

                # If search is about brakes, ONLY keep brake-related parts
                if any(
                    brake_term in intent_lower
                    for brake_term in ["brake", "braking", "stop"]
                ):
                    brake_filter = Q(
                        Q(name__icontains="brake")
                        | Q(description__icontains="brake")
                        | Q(name__icontains="pad")
                        | Q(description__icontains="pad")
                        | Q(name__icontains="rotor")
                        | Q(description__icontains="rotor")
                        | Q(name__icontains="disc")
                        | Q(description__icontains="disc")
                        | Q(name__icontains="caliper")
                        | Q(description__icontains="caliper")
                        | Q(category__name__icontains="brake")
                    )
                    brake_parts = parts.filter(brake_filter)
                    if brake_parts.exists():
                        parts = brake_parts

                # Engine/starting issues
                elif any(
                    engine_term in intent_lower
                    for engine_term in ["engine", "motor", "start", "starting"]
                ):
                    engine_filter = Q(
                        Q(name__icontains="engine")
                        | Q(description__icontains="engine")
                        | Q(name__icontains="motor")
                        | Q(description__icontains="motor")
                        | Q(name__icontains="starter")
                        | Q(description__icontains="starter")
                        | Q(name__icontains="battery")
                        | Q(description__icontains="battery")
                        | Q(name__icontains="ignition")
                        | Q(description__icontains="ignition")
                        | Q(category__name__icontains="engine")
                        | Q(category__name__icontains="electrical")
                    )
                    engine_parts = parts.filter(engine_filter)
                    if engine_parts.exists():
                        parts = engine_parts

                # Lighting issues
                elif any(
                    light_term in intent_lower
                    for light_term in ["light", "lighting", "headlight", "bulb"]
                ):
                    light_filter = Q(
                        Q(name__icontains="light")
                        | Q(description__icontains="light")
                        | Q(name__icontains="bulb")
                        | Q(description__icontains="bulb")
                        | Q(name__icontains="lamp")
                        | Q(description__icontains="lamp")
                        | Q(category__name__icontains="light")
                        | Q(category__name__icontains="lighting")
                    )
                    light_parts = parts.filter(light_filter)
                    if light_parts.exists():
                        parts = light_parts

            # Get count and limit results
            total_count = parts.count()
            final_parts = parts.order_by("-average_rating", "-total_sales")[:15]

            # Serialize results
            from parts.serializers import SparePartSerializer

            serializer = SparePartSerializer(final_parts, many=True)

            return Response(
                {
                    "results": serializer.data,
                    "search_query": query,
                    "ai_interpretation": intent_data,
                    "results_count": total_count,
                    "search_type": "semantic",
                }
            )

        except json.JSONDecodeError:
            # If AI response parsing fails, fall back to regular search
            return regular_search_fallback(query)

    except Exception as e:
        # If anything fails, fall back to regular search
        return regular_search_fallback(query)


def regular_search_fallback(query):
    """Fallback search function when AI search fails"""
    try:
        # First try the full query
        full_query_parts = SparePart.objects.filter(
            Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(part_number__icontains=query),
            is_active=True,
        )

        # Also break down query into individual words for broader search
        query_words = query.lower().split()
        meaningful_words = [
            w
            for w in query_words
            if len(w) > 2
            and w
            not in [
                "my",
                "the",
                "and",
                "for",
                "with",
                "have",
                "are",
                "too",
                "is",
                "low",
                "high",
            ]
        ]

        word_search_q = Q()
        for word in meaningful_words:
            word_search_q |= (
                Q(name__icontains=word)
                | Q(description__icontains=word)
                | Q(part_number__icontains=word)
                | Q(category__name__icontains=word)
            )

        word_parts = SparePart.objects.filter(word_search_q, is_active=True)

        # Combine both search approaches
        combined_parts = (
            (full_query_parts | word_parts)
            .distinct()
            .order_by("-average_rating", "-total_sales")
        )

        # Get count before slicing
        total_count = combined_parts.count()
        parts_limited = combined_parts[:20]

        from parts.serializers import SparePartSerializer

        serializer = SparePartSerializer(parts_limited, many=True)

        return Response(
            {
                "results": serializer.data,
                "search_query": query,
                "results_count": total_count,
                "search_type": "keyword_fallback",
                "fallback_keywords": meaningful_words,
            }
        )
    except Exception as e:
        return Response(
            {"error": f"Search failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
