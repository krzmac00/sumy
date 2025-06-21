#!/usr/bin/env python
"""
Real-time performance monitoring script for PoliConnect.
Monitors response times, error rates, and system resources.
"""

import time
import psutil
import requests
import statistics
from datetime import datetime
from collections import deque
import threading
import os
import sys

# Configuration
BASE_URL = os.environ.get('MONITOR_BASE_URL', 'http://localhost:8000')
CHECK_INTERVAL = int(os.environ.get('MONITOR_INTERVAL', '5'))  # seconds
WINDOW_SIZE = 60  # Keep last 60 measurements (5 minutes at 5-second intervals)

# Endpoints to monitor
ENDPOINTS = [
    {'path': '/api/v1/threads/', 'name': 'Forum List', 'method': 'GET'},
    {'path': '/api/noticeboard/advertisements/', 'name': 'Ads List', 'method': 'GET'},
    {'path': '/api/v1/events/', 'name': 'Events List', 'method': 'GET'},
    {'path': '/api/news/items/', 'name': 'News List', 'method': 'GET'},
]

# Performance thresholds (in milliseconds)
THRESHOLDS = {
    'good': 100,
    'warning': 200,
    'critical': 500
}


class PerformanceMonitor:
    def __init__(self):
        self.metrics = {
            endpoint['name']: {
                'response_times': deque(maxlen=WINDOW_SIZE),
                'errors': deque(maxlen=WINDOW_SIZE),
                'last_check': None
            }
            for endpoint in ENDPOINTS
        }
        self.system_metrics = {
            'cpu': deque(maxlen=WINDOW_SIZE),
            'memory': deque(maxlen=WINDOW_SIZE),
            'connections': deque(maxlen=WINDOW_SIZE)
        }
        self.running = True
    
    def check_endpoint(self, endpoint):
        """Check a single endpoint and record metrics"""
        start_time = time.time()
        
        try:
            response = requests.request(
                method=endpoint['method'],
                url=f"{BASE_URL}{endpoint['path']}",
                timeout=10
            )
            
            elapsed = (time.time() - start_time) * 1000  # Convert to ms
            
            self.metrics[endpoint['name']]['response_times'].append(elapsed)
            self.metrics[endpoint['name']]['errors'].append(0 if response.status_code < 400 else 1)
            self.metrics[endpoint['name']]['last_check'] = datetime.now()
            
            return elapsed, response.status_code
            
        except requests.exceptions.RequestException as e:
            elapsed = (time.time() - start_time) * 1000
            
            self.metrics[endpoint['name']]['response_times'].append(elapsed)
            self.metrics[endpoint['name']]['errors'].append(1)
            self.metrics[endpoint['name']]['last_check'] = datetime.now()
            
            return elapsed, None
    
    def check_system_resources(self):
        """Check system resource usage"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=0.1)
            self.system_metrics['cpu'].append(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            self.system_metrics['memory'].append(memory.percent)
            
            # Network connections
            connections = len([c for c in psutil.net_connections() if c.status == 'ESTABLISHED'])
            self.system_metrics['connections'].append(connections)
            
        except Exception as e:
            print(f"Error checking system resources: {e}")
    
    def get_color_code(self, response_time):
        """Get color code based on response time"""
        if response_time < THRESHOLDS['good']:
            return '\033[92m'  # Green
        elif response_time < THRESHOLDS['warning']:
            return '\033[93m'  # Yellow
        else:
            return '\033[91m'  # Red
    
    def calculate_stats(self, values):
        """Calculate statistics for a list of values"""
        if not values:
            return {'avg': 0, 'min': 0, 'max': 0, 'p95': 0}
        
        return {
            'avg': statistics.mean(values),
            'min': min(values),
            'max': max(values),
            'p95': statistics.quantiles(values, n=20)[18] if len(values) > 20 else max(values)
        }
    
    def print_dashboard(self):
        """Print performance dashboard"""
        # Clear screen
        os.system('cls' if os.name == 'nt' else 'clear')
        
        # Header
        print("\033[1m" + "="*80)
        print(f"PoliConnect Performance Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\033[0m")
        
        # Endpoint metrics
        print("\n\033[1mEndpoint Performance (last 5 minutes):\033[0m")
        print("-"*80)
        print(f"{'Endpoint':<20} {'Current':<12} {'Avg':<12} {'P95':<12} {'Errors':<10} {'Status'}")
        print("-"*80)
        
        for endpoint in ENDPOINTS:
            name = endpoint['name']
            metrics = self.metrics[name]
            
            if metrics['response_times']:
                current = metrics['response_times'][-1]
                stats = self.calculate_stats(list(metrics['response_times']))
                error_rate = sum(metrics['errors']) / len(metrics['errors']) * 100 if metrics['errors'] else 0
                
                color = self.get_color_code(current)
                status = "✓" if error_rate < 5 else "✗"
                
                print(f"{name:<20} "
                      f"{color}{current:>8.1f}ms\033[0m   "
                      f"{stats['avg']:>8.1f}ms   "
                      f"{stats['p95']:>8.1f}ms   "
                      f"{error_rate:>8.1f}%   "
                      f"{status}")
            else:
                print(f"{name:<20} {'N/A':<12} {'N/A':<12} {'N/A':<12} {'N/A':<10} ?")
        
        # System metrics
        print("\n\033[1mSystem Resources:\033[0m")
        print("-"*80)
        
        if self.system_metrics['cpu']:
            cpu_stats = self.calculate_stats(list(self.system_metrics['cpu']))
            mem_stats = self.calculate_stats(list(self.system_metrics['memory']))
            conn_stats = self.calculate_stats(list(self.system_metrics['connections']))
            
            print(f"CPU Usage:         Current: {self.system_metrics['cpu'][-1]:>5.1f}%  "
                  f"Avg: {cpu_stats['avg']:>5.1f}%  "
                  f"Max: {cpu_stats['max']:>5.1f}%")
            
            print(f"Memory Usage:      Current: {self.system_metrics['memory'][-1]:>5.1f}%  "
                  f"Avg: {mem_stats['avg']:>5.1f}%  "
                  f"Max: {mem_stats['max']:>5.1f}%")
            
            print(f"Active Connections: Current: {self.system_metrics['connections'][-1]:>5.0f}   "
                  f"Avg: {conn_stats['avg']:>5.0f}   "
                  f"Max: {conn_stats['max']:>5.0f}")
        
        # Performance summary
        print("\n\033[1mPerformance Summary:\033[0m")
        print("-"*80)
        
        all_response_times = []
        total_errors = 0
        total_requests = 0
        
        for name, metrics in self.metrics.items():
            if metrics['response_times']:
                all_response_times.extend(list(metrics['response_times']))
                total_errors += sum(metrics['errors'])
                total_requests += len(metrics['errors'])
        
        if all_response_times:
            overall_stats = self.calculate_stats(all_response_times)
            overall_error_rate = total_errors / total_requests * 100 if total_requests > 0 else 0
            
            print(f"Overall Average Response: {overall_stats['avg']:.1f}ms")
            print(f"Overall P95 Response:     {overall_stats['p95']:.1f}ms")
            print(f"Overall Error Rate:       {overall_error_rate:.1f}%")
            
            # Performance rating
            if overall_stats['avg'] < THRESHOLDS['good'] and overall_error_rate < 1:
                rating = "\033[92m★★★★★ EXCELLENT\033[0m"
            elif overall_stats['avg'] < THRESHOLDS['warning'] and overall_error_rate < 5:
                rating = "\033[93m★★★☆☆ GOOD\033[0m"
            else:
                rating = "\033[91m★☆☆☆☆ NEEDS ATTENTION\033[0m"
            
            print(f"\nPerformance Rating: {rating}")
        
        # Legend
        print("\n\033[90mLegend: Green < 100ms | Yellow < 200ms | Red >= 500ms")
        print(f"Refresh interval: {CHECK_INTERVAL}s | Press Ctrl+C to stop\033[0m")
    
    def monitor_loop(self):
        """Main monitoring loop"""
        while self.running:
            # Check endpoints
            for endpoint in ENDPOINTS:
                threading.Thread(target=self.check_endpoint, args=(endpoint,)).start()
            
            # Check system resources
            self.check_system_resources()
            
            # Update dashboard
            self.print_dashboard()
            
            # Wait for next check
            time.sleep(CHECK_INTERVAL)
    
    def stop(self):
        """Stop monitoring"""
        self.running = False


def main():
    """Main function"""
    print("Starting PoliConnect Performance Monitor...")
    print(f"Monitoring: {BASE_URL}")
    print(f"Check interval: {CHECK_INTERVAL} seconds")
    print("\nPress Ctrl+C to stop monitoring\n")
    
    # Test connection
    try:
        response = requests.get(f"{BASE_URL}/api/v1/threads/", timeout=5)
        print(f"Initial connection test: {'OK' if response.status_code < 400 else 'FAILED'}")
    except requests.exceptions.RequestException as e:
        print(f"Warning: Could not connect to {BASE_URL}")
        print(f"Error: {e}")
        print("\nContinuing anyway...\n")
    
    time.sleep(2)
    
    # Start monitoring
    monitor = PerformanceMonitor()
    
    try:
        monitor.monitor_loop()
    except KeyboardInterrupt:
        print("\n\nStopping monitor...")
        monitor.stop()
        
        # Print final summary
        print("\nFinal Statistics:")
        print("-"*40)
        
        for name, metrics in monitor.metrics.items():
            if metrics['response_times']:
                stats = monitor.calculate_stats(list(metrics['response_times']))
                print(f"{name}: Avg {stats['avg']:.1f}ms, P95 {stats['p95']:.1f}ms")


if __name__ == '__main__':
    main()