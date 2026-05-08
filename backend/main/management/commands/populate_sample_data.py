from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from main.models import (
    VehicleCategory, VehicleBrand, VehicleModel, SparePartCategory,
    SparePart, Shop, Rating, Review
)
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with sample data for vehicle spare parts website'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

        # Create vehicle categories
        categories_data = [
            ('Car', 'Passenger cars and sedans'),
            ('Motorcycle', 'Motorcycles and scooters'),
            ('Truck', 'Heavy vehicles and trucks'),
            ('Bus', 'Buses and coaches'),
            ('Van', 'Vans and commercial vehicles'),
        ]

        categories = {}
        for name, desc in categories_data:
            category, created = VehicleCategory.objects.get_or_create(
                name=name, defaults={'description': desc}
            )
            categories[name] = category
            if created:
                self.stdout.write(f'Created vehicle category: {name}')

        # Create vehicle brands
        brands_data = [
            ('Toyota', 'Car'), ('Honda Car', 'Car'), ('BMW', 'Car'), ('Mercedes-Benz Car', 'Car'),
            ('Nissan', 'Car'), ('Ford', 'Car'), ('Volkswagen', 'Car'), ('Audi', 'Car'),
            ('Yamaha', 'Motorcycle'), ('Honda Motorcycle', 'Motorcycle'), ('Kawasaki', 'Motorcycle'),
            ('Suzuki', 'Motorcycle'), ('Bajaj', 'Motorcycle'), ('TVS', 'Motorcycle'),
            ('Volvo', 'Truck'), ('Scania', 'Truck'), ('MAN', 'Truck'), ('Mercedes-Benz Truck', 'Truck'),
        ]

        brands = {}
        for brand_name, category_name in brands_data:
            brand, created = VehicleBrand.objects.get_or_create(
                name=brand_name,
                category=categories[category_name],
                defaults={}
            )
            brands[f'{brand_name}_{category_name}'] = brand
            if created:
                self.stdout.write(f'Created vehicle brand: {brand_name} ({category_name})')

        # Create vehicle models
        models_data = [
            ('Corolla', 'Toyota_Car', 2000, 2024),
            ('Camry', 'Toyota_Car', 1995, 2024),
            ('Civic', 'Honda Car_Car', 1995, 2024),
            ('Accord', 'Honda Car_Car', 1990, 2024),
            ('3 Series', 'BMW_Car', 1990, 2024),
            ('5 Series', 'BMW_Car', 1985, 2024),
            ('E-Class', 'Mercedes-Benz Car_Car', 1990, 2024),
            ('C-Class', 'Mercedes-Benz Car_Car', 1993, 2024),
            ('CBR 150R', 'Honda Motorcycle_Motorcycle', 2010, 2024),
            ('Shine', 'Honda Motorcycle_Motorcycle', 2006, 2024),
            ('R15', 'Yamaha_Motorcycle', 2008, 2024),
            ('FZ', 'Yamaha_Motorcycle', 2008, 2024),
        ]

        vehicle_models = []
        for model_name, brand_key, year_from, year_to in models_data:
            if brand_key in brands:
                model, created = VehicleModel.objects.get_or_create(
                    name=model_name,
                    brand=brands[brand_key],
                    defaults={'year_from': year_from, 'year_to': year_to}
                )
                vehicle_models.append(model)
                if created:
                    self.stdout.write(f'Created vehicle model: {model_name}')

        # Create spare part categories
        spare_part_categories_data = [
            ('Engine Parts', None, 'Engine components and parts'),
            ('Pistons', 'Engine Parts', 'Pistons and rings'),
            ('Valves', 'Engine Parts', 'Engine valves'),
            ('Brake System', None, 'Braking system components'),
            ('Brake Pads', 'Brake System', 'Brake pads and shoes'),
            ('Brake Discs', 'Brake System', 'Brake discs and rotors'),
            ('Electrical System', None, 'Electrical components'),
            ('Lights', 'Electrical System', 'Headlights, taillights, indicators'),
            ('Battery', 'Electrical System', 'Batteries and charging system'),
            ('Suspension', None, 'Suspension and steering components'),
            ('Shock Absorbers', 'Suspension', 'Shock absorbers and struts'),
            ('Body Parts', None, 'Body panels and exterior parts'),
            ('Bumpers', 'Body Parts', 'Front and rear bumpers'),
            ('Mirrors', 'Body Parts', 'Side mirrors and rearview mirrors'),
        ]

        spare_categories = {}
        # First create parent categories
        for name, parent_name, desc in spare_part_categories_data:
            if parent_name is None:
                category, created = SparePartCategory.objects.get_or_create(
                    name=name, defaults={'description': desc}
                )
                spare_categories[name] = category
                if created:
                    self.stdout.write(f'Created spare part category: {name}')

        # Then create subcategories
        for name, parent_name, desc in spare_part_categories_data:
            if parent_name is not None:
                category, created = SparePartCategory.objects.get_or_create(
                    name=name,
                    defaults={'description': desc, 'parent': spare_categories[parent_name]}
                )
                spare_categories[name] = category
                if created:
                    self.stdout.write(f'Created spare part subcategory: {name}')

        # Create sample users (sellers and buyers)
        users_data = [
            ('seller1', 'seller1@example.com', 'John Doe', 'SELLER'),
            ('seller2', 'seller2@example.com', 'Jane Smith', 'SELLER'),
            ('seller3', 'seller3@example.com', 'Mike Johnson', 'SELLER'),
            ('buyer1', 'buyer1@example.com', 'Alice Brown', 'BUYER'),
            ('buyer2', 'buyer2@example.com', 'Bob Wilson', 'BUYER'),
            ('buyer3', 'buyer3@example.com', 'Carol Davis', 'BUYER'),
        ]

        users = {}
        for username, email, name, role in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'name': name,
                    'role': role,
                    'nic': f'{random.randint(100000000, 999999999)}V',
                    'mobile_no': f'07{random.randint(10000000, 99999999)}',
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                users[username] = user
                self.stdout.write(f'Created user: {username} ({role})')

        # Create shops for sellers
        shops_data = [
            ('seller1', 'AutoParts Pro', 'Premium auto parts supplier', '123 Main St, Colombo'),
            ('seller2', 'Motor Parts Hub', 'Your one-stop parts solution', '456 Galle Rd, Colombo'),
            ('seller3', 'Speed Parts Store', 'Performance parts specialist', '789 Kandy Rd, Kandy'),
        ]

        shops = {}
        for seller_username, shop_name, description, address in shops_data:
            if seller_username in users:
                shop, created = Shop.objects.get_or_create(
                    seller=users[seller_username],
                    defaults={
                        'name': shop_name,
                        'description': description,
                        'address': address,
                        'phone': f'011{random.randint(1000000, 9999999)}',
                        'email': f'{shop_name.lower().replace(" ", "")}@example.com',
                        'is_verified': True,
                    }
                )
                shops[seller_username] = shop
                if created:
                    self.stdout.write(f'Created shop: {shop_name}')

        # Create sample spare parts
        spare_parts_data = [
            ('Engine Oil Filter', 'seller1', 'Oil Filters', 'High quality oil filter for cars', 'NEW', 25.00),
            ('Brake Pads Front Set', 'seller1', 'Brake Pads', 'Ceramic brake pads for front wheels', 'NEW', 85.00),
            ('LED Headlight Bulb', 'seller2', 'Lights', 'Bright LED headlight replacement', 'NEW', 35.00),
            ('Shock Absorber Rear', 'seller2', 'Shock Absorbers', 'Heavy duty rear shock absorber', 'NEW', 120.00),
            ('Side Mirror Left', 'seller3', 'Mirrors', 'Left side mirror with indicator', 'USED', 45.00),
            ('Front Bumper', 'seller3', 'Bumpers', 'OEM front bumper for sedan', 'REFURBISHED', 200.00),
            ('Car Battery 12V', 'seller1', 'Battery', '70Ah car battery with warranty', 'NEW', 150.00),
            ('Motorcycle Chain', 'seller2', 'Engine Parts', 'Heavy duty motorcycle chain', 'NEW', 30.00),
        ]

        spare_parts = []
        for name, seller_username, category_name, description, condition, price in spare_parts_data:
            if seller_username in users and category_name in spare_categories:
                spare_part, created = SparePart.objects.get_or_create(
                    name=name,
                    seller=users[seller_username],
                    defaults={
                        'description': description,
                        'category': spare_categories[category_name],
                        'shop': shops.get(seller_username),
                        'condition': condition,
                        'price': Decimal(str(price)),
                        'quantity': random.randint(1, 20),
                        'part_number': f'PN{random.randint(100000, 999999)}',
                        'total_sales': random.randint(0, 50),
                        'average_rating': Decimal(str(round(random.uniform(3.5, 5.0), 2))),
                        'total_ratings': random.randint(0, 25),
                    }
                )
                spare_parts.append(spare_part)
                
                # Add compatible vehicles
                if created:
                    compatible_models = random.sample(vehicle_models, min(3, len(vehicle_models)))
                    spare_part.compatible_vehicles.set(compatible_models)
                    self.stdout.write(f'Created spare part: {name}')

        # Create sample ratings and reviews
        if spare_parts and users:
            for _ in range(20):
                # Random rating
                rater = random.choice(list(users.values()))
                spare_part = random.choice(spare_parts)
                
                # Avoid rating own parts
                if rater != spare_part.seller:
                    rating, created = Rating.objects.get_or_create(
                        rater=rater,
                        rated_spare_part=spare_part,
                        defaults={
                            'rating_type': 'SPARE_PART',
                            'rating': random.randint(3, 5),
                        }
                    )
                    
                    if created:
                        # Create a review for some ratings
                        if random.choice([True, False]):
                            review_titles = [
                                'Great quality product',
                                'Excellent service',
                                'Good value for money',
                                'Fast delivery',
                                'Highly recommended',
                                'Perfect fit',
                                'Durable and reliable',
                            ]
                            review_contents = [
                                'This part works perfectly and was delivered quickly.',
                                'Excellent quality and fits perfectly in my vehicle.',
                                'Great value for money. Highly recommend this seller.',
                                'Fast shipping and good packaging. Will buy again.',
                                'Exactly what I needed. Good quality product.',
                                'Works great, no issues so far. Good purchase.',
                                'Reliable part, good customer service from seller.',
                            ]
                            
                            Review.objects.create(
                                reviewer=rater,
                                reviewed_spare_part=spare_part,
                                review_type='SPARE_PART',
                                title=random.choice(review_titles),
                                content=random.choice(review_contents),
                                rating=rating,
                                is_verified=True,
                            )

        self.stdout.write(
            self.style.SUCCESS('Successfully populated database with sample data!')
        )
        self.stdout.write('You can now test the API endpoints with sample data.')
