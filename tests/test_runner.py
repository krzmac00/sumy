#!/usr/bin/env python
"""
Test Runner with Visual Reporting
Generates comprehensive test reports with charts and statistics
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from jinja2 import Template
import pandas as pd


class ReportGenerator:
    """Generate visual test reports"""
    
    def __init__(self, project_root=None):
        self.project_root = project_root or Path.cwd()
        self.reports_dir = self.project_root / 'reports'
        self.reports_dir.mkdir(exist_ok=True)
        
    def run_tests(self, test_args=None):
        """Run pytest and collect results"""
        args = [
            'pytest',
            '--json-report',
            f'--json-report-file={self.reports_dir}/test-report.json',
            '--html={}/test-report.html'.format(self.reports_dir),
            '--self-contained-html',
            '--cov=.',
            '--cov-report=json',
            f'--cov-report=html:{self.reports_dir}/coverage',
            '--cov-report=term'
        ]
        
        if test_args:
            args.extend(test_args)
        
        print(f"Running tests with args: {' '.join(args)}")
        result = subprocess.run(args, capture_output=True, text=True)
        
        print("\n" + "="*60)
        print("TEST OUTPUT")
        print("="*60)
        print(result.stdout)
        
        if result.stderr:
            print("\nERRORS:")
            print(result.stderr)
        
        return result.returncode
    
    def load_test_results(self):
        """Load test results from JSON report"""
        report_file = self.reports_dir / 'test-report.json'
        
        if not report_file.exists():
            print(f"Test report not found at {report_file}")
            return None
        
        with open(report_file) as f:
            return json.load(f)
    
    def load_coverage_data(self):
        """Load coverage data from JSON report"""
        coverage_file = self.project_root / 'coverage.json'
        
        if not coverage_file.exists():
            print(f"Coverage report not found at {coverage_file}")
            return None
        
        with open(coverage_file) as f:
            return json.load(f)
    
    def create_test_summary_chart(self, test_data):
        """Create test summary pie chart"""
        summary = test_data['summary']
        
        labels = []
        values = []
        colors = []
        
        if summary.get('passed', 0) > 0:
            labels.append('Passed')
            values.append(summary['passed'])
            colors.append('#28a745')
        
        if summary.get('failed', 0) > 0:
            labels.append('Failed')
            values.append(summary['failed'])
            colors.append('#dc3545')
        
        if summary.get('skipped', 0) > 0:
            labels.append('Skipped')
            values.append(summary['skipped'])
            colors.append('#ffc107')
        
        if summary.get('error', 0) > 0:
            labels.append('Error')
            values.append(summary['error'])
            colors.append('#fd7e14')
        
        fig = go.Figure(data=[go.Pie(
            labels=labels,
            values=values,
            hole=.3,
            marker_colors=colors
        )])
        
        fig.update_layout(
            title='Test Results Summary',
            height=400,
            showlegend=True
        )
        
        return fig
    
    def create_test_duration_chart(self, test_data):
        """Create test duration bar chart"""
        tests = test_data['tests']
        
        # Get slowest tests
        test_times = []
        for test in tests:
            if 'duration' in test:
                test_times.append({
                    'name': test['nodeid'].split('::')[-1][:50],
                    'duration': test['duration'],
                    'outcome': test['outcome']
                })
        
        # Sort by duration and take top 20
        test_times.sort(key=lambda x: x['duration'], reverse=True)
        test_times = test_times[:20]
        
        if not test_times:
            return None
        
        df = pd.DataFrame(test_times)
        
        color_map = {
            'passed': '#28a745',
            'failed': '#dc3545',
            'skipped': '#ffc107'
        }
        
        fig = px.bar(
            df, 
            x='duration', 
            y='name',
            orientation='h',
            color='outcome',
            color_discrete_map=color_map,
            title='Top 20 Slowest Tests',
            labels={'duration': 'Duration (seconds)', 'name': 'Test Name'}
        )
        
        fig.update_layout(height=600)
        
        return fig
    
    def create_coverage_chart(self, coverage_data):
        """Create coverage visualization"""
        if not coverage_data:
            return None
        
        files = coverage_data.get('files', {})
        
        # Aggregate by module
        modules = {}
        for filepath, data in files.items():
            parts = filepath.split('/')
            if len(parts) > 1 and parts[0] in ['accounts', 'mainapp', 'news', 'noticeboard', 'map']:
                module = parts[0]
                if module not in modules:
                    modules[module] = {
                        'statements': 0,
                        'missing': 0,
                        'covered': 0
                    }
                
                summary = data.get('summary', {})
                modules[module]['statements'] += summary.get('num_statements', 0)
                modules[module]['missing'] += summary.get('missing_lines', 0)
                modules[module]['covered'] += summary.get('covered_lines', 0)
        
        # Calculate percentages
        module_data = []
        for module, stats in modules.items():
            if stats['statements'] > 0:
                percentage = (stats['covered'] / stats['statements']) * 100
                module_data.append({
                    'module': module,
                    'coverage': percentage,
                    'statements': stats['statements'],
                    'covered': stats['covered'],
                    'missing': stats['missing']
                })
        
        if not module_data:
            return None
        
        df = pd.DataFrame(module_data)
        df = df.sort_values('coverage', ascending=True)
        
        fig = px.bar(
            df,
            x='coverage',
            y='module',
            orientation='h',
            title='Code Coverage by Module',
            labels={'coverage': 'Coverage %', 'module': 'Module'},
            text='coverage',
            color='coverage',
            color_continuous_scale=['#dc3545', '#ffc107', '#28a745'],
            range_color=[0, 100]
        )
        
        fig.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
        fig.update_layout(height=400)
        
        return fig
    
    def create_test_timeline(self, test_data):
        """Create test execution timeline"""
        tests = test_data['tests']
        
        timeline_data = []
        for test in tests:
            if 'duration' in test and 'start' in test:
                timeline_data.append({
                    'test': test['nodeid'].split('::')[-1][:30],
                    'start': test['start'],
                    'duration': test['duration'],
                    'outcome': test['outcome']
                })
        
        if not timeline_data:
            return None
        
        # Sort by start time
        timeline_data.sort(key=lambda x: x['start'])
        
        # Create Gantt chart
        fig = go.Figure()
        
        color_map = {
            'passed': '#28a745',
            'failed': '#dc3545',
            'skipped': '#ffc107'
        }
        
        for i, test in enumerate(timeline_data[:50]):  # Limit to 50 tests
            fig.add_trace(go.Bar(
                x=[test['duration']],
                y=[test['test']],
                orientation='h',
                name=test['outcome'],
                marker_color=color_map.get(test['outcome'], '#6c757d'),
                showlegend=False,
                hovertemplate=f"Test: {test['test']}<br>Duration: {test['duration']:.2f}s<br>Status: {test['outcome']}"
            ))
        
        fig.update_layout(
            title='Test Execution Timeline (First 50 Tests)',
            xaxis_title='Duration (seconds)',
            yaxis_title='Test',
            height=800,
            barmode='overlay'
        )
        
        return fig
    
    def generate_html_report(self, test_data, coverage_data):
        """Generate comprehensive HTML report"""
        template = Template('''
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - {{ project_name }}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .timestamp {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            color: white;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
            font-weight: normal;
        }
        .summary-card .value {
            font-size: 36px;
            font-weight: bold;
        }
        .passed { background-color: #28a745; }
        .failed { background-color: #dc3545; }
        .skipped { background-color: #ffc107; }
        .total { background-color: #007bff; }
        .chart-container {
            margin-bottom: 40px;
        }
        .failed-tests {
            margin-top: 40px;
        }
        .failed-test {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .failed-test h4 {
            margin: 0 0 10px 0;
            color: #721c24;
        }
        .failed-test pre {
            background-color: white;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Report - {{ project_name }}</h1>
        <div class="timestamp">Generated on {{ timestamp }}</div>
        
        <div class="summary-grid">
            <div class="summary-card total">
                <h3>Total Tests</h3>
                <div class="value">{{ total_tests }}</div>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <div class="value">{{ passed_tests }}</div>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div class="value">{{ failed_tests }}</div>
            </div>
            <div class="summary-card skipped">
                <h3>Skipped</h3>
                <div class="value">{{ skipped_tests }}</div>
            </div>
        </div>
        
        <div class="chart-container" id="summary-chart"></div>
        <div class="chart-container" id="duration-chart"></div>
        <div class="chart-container" id="coverage-chart"></div>
        <div class="chart-container" id="timeline-chart"></div>
        
        {% if failed_tests_list %}
        <div class="failed-tests">
            <h2>Failed Tests</h2>
            {% for test in failed_tests_list %}
            <div class="failed-test">
                <h4>{{ test.name }}</h4>
                <pre>{{ test.error }}</pre>
            </div>
            {% endfor %}
        </div>
        {% endif %}
    </div>
    
    <script>
        // Render charts
        {% if summary_chart %}
        Plotly.newPlot('summary-chart', {{ summary_chart }});
        {% endif %}
        
        {% if duration_chart %}
        Plotly.newPlot('duration-chart', {{ duration_chart }});
        {% endif %}
        
        {% if coverage_chart %}
        Plotly.newPlot('coverage-chart', {{ coverage_chart }});
        {% endif %}
        
        {% if timeline_chart %}
        Plotly.newPlot('timeline-chart', {{ timeline_chart }});
        {% endif %}
    </script>
</body>
</html>
        ''')
        
        # Create charts
        summary_chart = self.create_test_summary_chart(test_data)
        duration_chart = self.create_test_duration_chart(test_data)
        coverage_chart = self.create_coverage_chart(coverage_data)
        timeline_chart = self.create_test_timeline(test_data)
        
        # Get failed tests
        failed_tests_list = []
        for test in test_data.get('tests', []):
            if test['outcome'] == 'failed':
                failed_tests_list.append({
                    'name': test['nodeid'],
                    'error': test.get('call', {}).get('longrepr', 'No error details available')
                })
        
        # Render template
        html = template.render(
            project_name='PoliConnect',
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            total_tests=test_data['summary']['total'],
            passed_tests=test_data['summary'].get('passed', 0),
            failed_tests=test_data['summary'].get('failed', 0),
            skipped_tests=test_data['summary'].get('skipped', 0),
            summary_chart=summary_chart.to_json() if summary_chart else None,
            duration_chart=duration_chart.to_json() if duration_chart else None,
            coverage_chart=coverage_chart.to_json() if coverage_chart else None,
            timeline_chart=timeline_chart.to_json() if timeline_chart else None,
            failed_tests_list=failed_tests_list
        )
        
        # Save report
        report_path = self.reports_dir / 'visual-test-report.html'
        with open(report_path, 'w') as f:
            f.write(html)
        
        print(f"\nVisual test report generated: {report_path}")
        return report_path


def main():
    """Main entry point"""
    generator = ReportGenerator()
    
    # Run tests
    return_code = generator.run_tests(sys.argv[1:])
    
    # Load results
    test_data = generator.load_test_results()
    coverage_data = generator.load_coverage_data()
    
    if test_data:
        # Generate visual report
        generator.generate_html_report(test_data, coverage_data)
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total: {test_data['summary']['total']}")
        print(f"Passed: {test_data['summary'].get('passed', 0)}")
        print(f"Failed: {test_data['summary'].get('failed', 0)}")
        print(f"Skipped: {test_data['summary'].get('skipped', 0)}")
        print(f"Duration: {test_data['duration']:.2f}s")
        print("="*60)
    
    return return_code


if __name__ == '__main__':
    sys.exit(main())