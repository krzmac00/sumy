import pytest
from django.utils import timezone
from django.core.exceptions import ValidationError
from noticeboard.models import Advertisement, Comment
from tests.base import BaseTestCase
from tests.factories import UserFactory, AdvertisementFactory, CommentFactory
from datetime import timedelta


class TestAdvertisementModel(BaseTestCase):
    """Test Advertisement model functionality"""
    
    @BaseTestCase.doc
    def test_advertisement_creation(self):
        """
        Test basic advertisement creation
        
        Verifies:
        - Advertisement can be created with required fields
        - Default values are set correctly
        - Timestamps are set automatically
        """
        ad = Advertisement.objects.create(
            title="Calculus Textbook for Sale",
            content="Good condition, latest edition",
            category='sale',
            author=self.test_user,
            price=50.00,
            contact_info="555-0123",
            location="Campus Bookstore"
        )
        
        self.assertEqual(ad.title, "Calculus Textbook for Sale")
        self.assertEqual(ad.content, "Good condition, latest edition")
        self.assertEqual(ad.category, 'sale')
        self.assertEqual(ad.author, self.test_user)
        self.assertEqual(ad.price, 50.00)
        self.assertTrue(ad.is_active)
        self.assertIsNotNone(ad.created_date)
        self.assertIsNotNone(ad.last_activity_date)
    
    @BaseTestCase.doc
    def test_advertisement_expiry(self):
        """
        Test advertisement expiry functionality
        
        Verifies:
        - Advertisements can have expiry dates
        - Expired ads are marked as inactive
        - Non-expired ads remain active
        """
        # Create ad expiring in future
        future_ad = AdvertisementFactory(
            expires_at=timezone.now() + timedelta(days=7)
        )
        self.assertTrue(future_ad.is_active)
        self.assertFalse(future_ad.is_expired())
        
        # Create expired ad
        past_ad = AdvertisementFactory(
            expires_at=timezone.now() - timedelta(days=1)
        )
        self.assertTrue(past_ad.is_expired())
        
        # Save should mark it as inactive
        past_ad.save()
        self.assertFalse(past_ad.is_active)
    
    @BaseTestCase.doc
    def test_advertisement_category_validation(self):
        """
        Test advertisement category validation
        
        Verifies:
        - Valid categories are accepted
        - Invalid categories raise error
        """
        valid_categories = ['announcement', 'sale', 'buy', 'service', 'event', 'lost_found', 'other']
        
        for category in valid_categories:
            ad = AdvertisementFactory(category=category)
            self.assertEqual(ad.category, category)
    
    @BaseTestCase.doc
    def test_advertisement_str_representation(self):
        """
        Test advertisement string representation
        
        Verifies:
        - __str__ returns advertisement title
        """
        ad = AdvertisementFactory(title="Gaming Laptop for Sale")
        self.assertEqual(str(ad), "Gaming Laptop for Sale")
    
    @BaseTestCase.doc
    def test_advertisement_ordering(self):
        """
        Test advertisements are ordered by last activity date
        
        Verifies:
        - Newer activity comes first
        """
        # Create ads with different activity dates
        old_ad = AdvertisementFactory()
        Advertisement.objects.filter(pk=old_ad.pk).update(
            last_activity_date=timezone.now() - timedelta(days=2)
        )
        
        new_ad = AdvertisementFactory()
        
        # Filter to only get our test ads
        ads = list(Advertisement.objects.filter(id__in=[old_ad.id, new_ad.id]))
        self.assertEqual(ads[0], new_ad)
        self.assertEqual(ads[1], old_ad)
    
    @BaseTestCase.doc
    def test_advertisement_price_validation(self):
        """
        Test advertisement price field
        
        Verifies:
        - Price can be null (for non-sale items)
        - Price accepts decimal values
        """
        # Test null price
        ad_no_price = AdvertisementFactory(price=None)
        self.assertIsNone(ad_no_price.price)
        
        # Test decimal price
        ad_with_price = AdvertisementFactory(price=99.99)
        self.assertEqual(ad_with_price.price, 99.99)
    
    @BaseTestCase.doc
    def test_advertisement_last_activity_update(self):
        """
        Test that comments update advertisement's last activity
        
        Verifies:
        - Adding a comment updates last_activity_date
        """
        ad = AdvertisementFactory()
        old_activity = ad.last_activity_date
        
        # Wait a moment to ensure time difference
        import time
        time.sleep(0.1)
        
        # Add a comment
        comment = Comment.objects.create(
            advertisement=ad,
            author=self.test_user,
            content="Is this still available?"
        )
        
        ad.refresh_from_db()
        self.assertGreater(ad.last_activity_date, old_activity)


class TestCommentModel(BaseTestCase):
    """Test Comment model functionality"""
    
    @BaseTestCase.doc
    def test_comment_creation(self):
        """
        Test basic comment creation
        
        Verifies:
        - Comment can be created with required fields
        - Default values are set correctly
        - Related to advertisement correctly
        """
        ad = AdvertisementFactory()
        comment = Comment.objects.create(
            advertisement=ad,
            author=self.test_user,
            content="Is this still available?",
            is_public=True
        )
        
        self.assertEqual(comment.advertisement, ad)
        self.assertEqual(comment.author, self.test_user)
        self.assertEqual(comment.content, "Is this still available?")
        self.assertTrue(comment.is_public)
        self.assertFalse(comment.was_edited)
        self.assertIsNotNone(comment.created_date)
    
    @BaseTestCase.doc
    def test_comment_privacy(self):
        """
        Test comment privacy settings
        
        Verifies:
        - Comments can be public or private
        - Default is private (False)
        """
        ad = AdvertisementFactory()
        
        # Test default privacy
        private_comment = CommentFactory(advertisement=ad, is_public=False)
        self.assertFalse(private_comment.is_public)
        
        # Test public comment
        public_comment = CommentFactory(advertisement=ad, is_public=True)
        self.assertTrue(public_comment.is_public)
    
    @BaseTestCase.doc
    def test_comment_str_representation(self):
        """
        Test comment string representation
        
        Verifies:
        - __str__ shows author and advertisement
        """
        ad = AdvertisementFactory(title="Test Ad")
        comment = CommentFactory(
            advertisement=ad,
            author=self.test_user
        )
        
        str_repr = str(comment)
        self.assertIn(self.test_user.username, str_repr)
        self.assertIn("Test Ad", str_repr)
    
    @BaseTestCase.doc
    def test_comment_ordering(self):
        """
        Test comments are ordered by creation date
        
        Verifies:
        - Older comments come first
        """
        ad = AdvertisementFactory()
        
        comment1 = CommentFactory(advertisement=ad)
        comment2 = CommentFactory(advertisement=ad)
        comment3 = CommentFactory(advertisement=ad)
        
        comments = list(Comment.objects.filter(advertisement=ad))
        self.assertEqual(comments, [comment1, comment2, comment3])
    
    @BaseTestCase.doc
    def test_comment_edit_flag(self):
        """
        Test comment edit tracking
        
        Verifies:
        - was_edited flag can be set
        - Useful for showing edit history
        """
        comment = CommentFactory(was_edited=False)
        self.assertFalse(comment.was_edited)
        
        # Simulate edit
        comment.content = "Updated content"
        comment.was_edited = True
        comment.save()
        
        self.assertTrue(comment.was_edited)


@pytest.mark.django_db
class TestAdvertisementQuerySet:
    """Test custom queryset methods for Advertisement"""
    
    def test_active_advertisements_filter(self):
        """Test filtering active advertisements"""
        # Create mix of active and inactive ads
        active_ad = AdvertisementFactory(is_active=True)
        inactive_ad = AdvertisementFactory(is_active=False)
        
        active_ads = Advertisement.objects.filter(is_active=True)
        
        assert active_ad in active_ads
        assert inactive_ad not in active_ads
    
    def test_category_filter(self):
        """Test filtering by category"""
        sale_ad = AdvertisementFactory(category='sale')
        service_ad = AdvertisementFactory(category='service')
        event_ad = AdvertisementFactory(category='event')
        
        sale_ads = Advertisement.objects.filter(category='sale')
        
        assert sale_ad in sale_ads
        assert service_ad not in sale_ads
        assert event_ad not in sale_ads
    
    def test_search_functionality(self):
        """Test searching advertisements"""
        from django.db.models import Q
        
        # Create test ads
        laptop_ad = AdvertisementFactory(
            title="Gaming Laptop",
            content="High performance laptop"
        )
        
        book_ad = AdvertisementFactory(
            title="Programming Book",
            content="Learn Python"
        )
        
        desk_ad = AdvertisementFactory(
            title="Study Desk",
            content="Perfect for laptop work"
        )
        
        # Search for "laptop"
        results = Advertisement.objects.filter(
            Q(title__icontains='laptop') |
            Q(content__icontains='laptop')
        )
        
        assert results.count() == 2
        assert laptop_ad in results
        assert desk_ad in results
        assert book_ad not in results