"""
Locust load testing file for PoliConnect.
This simulates realistic user behavior with 10,000+ concurrent users.

To run:
    locust -f locustfile.py --host=http://localhost:8000
    
Or headless:
    locust -f locustfile.py --host=http://localhost:8000 --headless -u 10000 -r 100 -t 5m
"""

import random
import json
from locust import HttpUser, task, between
from locust.exception import RescheduleTask


class PoliConnectUser(HttpUser):
    """Simulates a typical PoliConnect user"""
    
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    
    def on_start(self):
        """Login when user starts"""
        # Try to login with test user credentials
        self.user_id = random.randint(0, 99)
        self.email = f"loadtest{self.user_id}@edu.p.lodz.pl"
        self.password = "testpass123"
        
        # Attempt login
        response = self.client.post(
            "/api/accounts/login/",
            json={
                "email": self.email,
                "password": self.password
            },
            catch_response=True
        )
        
        if response.status_code == 200:
            try:
                data = response.json()
                self.token = data.get("access")
                self.client.headers.update({
                    "Authorization": f"Bearer {self.token}"
                })
                response.success()
            except:
                response.failure("Failed to parse login response")
                self.token = None
        else:
            # If login fails, continue as anonymous user
            response.failure(f"Login failed with status {response.status_code}")
            self.token = None
    
    @task(40)
    def view_forum_threads(self):
        """View forum threads (most common action)"""
        with self.client.get(
            "/api/v1/threads/",
            name="Forum: List threads",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(20)
    def view_advertisements(self):
        """View advertisement list"""
        with self.client.get(
            "/api/noticeboard/advertisements/",
            name="Noticeboard: List ads",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(15)
    def view_events(self):
        """View calendar events"""
        with self.client.get(
            "/api/v1/events/",
            name="Calendar: List events",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(10)
    def view_news(self):
        """View news items"""
        with self.client.get(
            "/api/news/items/",
            name="News: List items",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(5)
    def search_forum(self):
        """Search forum threads"""
        search_terms = ["help", "exam", "project", "deadline", "question"]
        term = random.choice(search_terms)
        
        with self.client.get(
            f"/api/v1/threads/?search={term}",
            name="Forum: Search",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(3)
    def create_forum_thread(self):
        """Create a new forum thread (requires auth)"""
        if not self.token:
            raise RescheduleTask()  # Skip if not authenticated
        
        thread_data = {
            "title": f"Load test thread {random.randint(1000, 9999)}",
            "content": "This is a load test thread to verify system performance.",
            "category": random.choice(["academic", "social", "technical", "other"]),
            "is_anonymous": random.choice([True, False])
        }
        
        with self.client.post(
            "/api/v1/threads/",
            json=thread_data,
            name="Forum: Create thread",
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(2)
    def create_advertisement(self):
        """Create a new advertisement (requires auth)"""
        if not self.token:
            raise RescheduleTask()
        
        ad_data = {
            "title": f"Load test ad {random.randint(1000, 9999)}",
            "content": "This is a load test advertisement.",
            "category": random.choice(["sale", "buy", "service", "announcement"]),
            "location": "Campus",
            "contact_info": self.email
        }
        
        with self.client.post(
            "/api/noticeboard/advertisements/",
            json=ad_data,
            name="Noticeboard: Create ad",
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(5)
    def view_thread_detail(self):
        """View a specific thread with posts"""
        # Get a random thread ID (assuming IDs 1-100 exist)
        thread_id = random.randint(1, 100)
        
        with self.client.get(
            f"/api/v1/threads/{thread_id}/",
            name="Forum: View thread detail",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                response.success()  # 404 is acceptable for random IDs
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(3)
    def view_user_profile(self):
        """View user profile"""
        if not self.token:
            raise RescheduleTask()
        
        with self.client.get(
            "/api/accounts/profile/",
            name="User: View profile",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")


class MobileAppUser(HttpUser):
    """Simulates mobile app user with different behavior patterns"""
    
    wait_time = between(2, 8)  # Mobile users interact less frequently
    
    def on_start(self):
        """Mobile users often stay logged in"""
        self.user_id = random.randint(100, 199)
        self.email = f"mobile{self.user_id}@edu.p.lodz.pl"
        self.password = "testpass123"
        
        response = self.client.post(
            "/api/accounts/login/",
            json={
                "email": self.email,
                "password": self.password
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.client.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
    
    @task(50)
    def check_notifications(self):
        """Mobile users frequently check for updates"""
        endpoints = [
            "/api/v1/events/",  # Check calendar
            "/api/v1/threads/?limit=10",  # Recent threads
            "/api/noticeboard/advertisements/?limit=5",  # Recent ads
        ]
        
        endpoint = random.choice(endpoints)
        name = f"Mobile: Check {endpoint.split('/')[3]}"
        
        with self.client.get(
            endpoint,
            name=name,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(30)
    def quick_browse(self):
        """Quick browsing behavior"""
        with self.client.get(
            "/api/v1/threads/?limit=20",
            name="Mobile: Quick browse",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(20)
    def view_my_content(self):
        """View user's own content"""
        if not hasattr(self, 'token'):
            raise RescheduleTask()
        
        endpoints = [
            "/api/v1/events/?category=private",
            "/api/v1/threads/?author=me",
        ]
        
        endpoint = random.choice(endpoints)
        
        with self.client.get(
            endpoint,
            name="Mobile: My content",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")


class AdminUser(HttpUser):
    """Simulates admin/moderator behavior"""
    
    wait_time = between(5, 15)  # Admins perform fewer but heavier operations
    weight = 1  # Only 1% of users are admins
    
    def on_start(self):
        """Login as admin"""
        self.email = "admin@p.lodz.pl"
        self.password = "adminpass123"
        
        response = self.client.post(
            "/api/accounts/login/",
            json={
                "email": self.email,
                "password": self.password
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.client.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
    
    @task(40)
    def review_content(self):
        """Review reported content"""
        with self.client.get(
            "/api/v1/threads/?ordering=-created_date",
            name="Admin: Review recent content",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(30)
    def check_analytics(self):
        """Check analytics dashboard"""
        with self.client.get(
            "/api/analytics/endpoint-usage/",
            name="Admin: Analytics",
            catch_response=True
        ) as response:
            if response.status_code in [200, 403]:  # 403 if not admin
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(30)
    def manage_users(self):
        """User management operations"""
        with self.client.get(
            "/api/accounts/users/?limit=50",
            name="Admin: User list",
            catch_response=True
        ) as response:
            if response.status_code in [200, 403]:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")