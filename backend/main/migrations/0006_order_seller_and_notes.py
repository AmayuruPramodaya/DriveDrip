# Generated manually to add seller and notes fields to Order model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def populate_seller_field(apps, schema_editor):
    """
    Populate seller field for existing orders based on the spare parts in order items
    """
    Order = apps.get_model('main', 'Order')
    OrderItem = apps.get_model('main', 'OrderItem')
    
    for order in Order.objects.all():
        # Get the first order item to determine the seller
        first_item = OrderItem.objects.filter(order=order).first()
        if first_item and first_item.spare_part:
            order.seller = first_item.spare_part.seller
            order.save()


def reverse_populate_seller_field(apps, schema_editor):
    """
    Reverse migration - nothing to do
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0005_update_shop_multiple_per_seller'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='seller',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='seller_orders', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='order',
            name='notes',
            field=models.TextField(blank=True, verbose_name='notes'),
        ),
        migrations.AlterField(
            model_name='order',
            name='buyer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='buyer_orders', to=settings.AUTH_USER_MODEL),
        ),
        migrations.RunPython(populate_seller_field, reverse_populate_seller_field),
        migrations.AlterField(
            model_name='order',
            name='seller',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='seller_orders', to=settings.AUTH_USER_MODEL),
        ),
    ]
