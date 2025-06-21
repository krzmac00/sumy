#!/usr/bin/env python
"""
Integration Test Report Generator for PoliConnect

Generates a comprehensive HTML report of integration test results with:
- Test execution summary
- Pass/fail statistics
- Coverage metrics
- Performance data
- Detailed failure analysis
"""

import subprocess
import json
import os
from datetime import datetime
from pathlib import Path
import html


def run_tests_with_json_report():
    """Run integration tests and generate JSON report"""
    cmd = [
        'python', '-m', 'pytest',
        'tests/integration/',
        '-v',
        '--tb=short',
        '--json-report',
        '--json-report-file=reports/integration_test_results.json',
        '--cov=.',
        '--cov-report=html:reports/coverage',
        '--cov-report=json:reports/coverage.json'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def parse_json_report(json_file='reports/integration_test_results.json'):
    """Parse the JSON test report"""
    try:
        with open(json_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None


def parse_coverage_report(json_file='reports/coverage.json'):
    """Parse the coverage JSON report"""
    try:
        with open(json_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None


def generate_html_report(test_data, coverage_data):
    """Generate comprehensive HTML report"""
    
    # Calculate statistics
    total_tests = test_data['summary']['total']
    passed = test_data['summary'].get('passed', 0)
    failed = test_data['summary'].get('failed', 0)
    skipped = test_data['summary'].get('skipped', 0)
    errors = test_data['summary'].get('error', 0)
    
    pass_rate = (passed / total_tests * 100) if total_tests > 0 else 0
    
    # Get coverage percentage
    coverage_percent = coverage_data['totals']['percent_covered'] if coverage_data else 0
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>PoliConnect Integration Test Report</title>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        
        h1, h2, h3 {{
            color: #2c3e50;
        }}
        
        .summary {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }}
        
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        
        .stat-card {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e9ecef;
        }}
        
        .stat-value {{
            font-size: 2em;
            font-weight: bold;
            margin: 5px 0;
        }}
        
        .stat-label {{
            color: #6c757d;
            font-size: 0.9em;
        }}
        
        .passed {{ color: #28a745; }}
        .failed {{ color: #dc3545; }}
        .skipped {{ color: #ffc107; }}
        .error {{ color: #dc3545; }}
        
        .test-results {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }}
        
        .test-item {{
            padding: 10px;
            margin: 5px 0;
            border-left: 4px solid #e9ecef;
            background: #f8f9fa;
        }}
        
        .test-item.passed {{
            border-left-color: #28a745;
        }}
        
        .test-item.failed {{
            border-left-color: #dc3545;
        }}
        
        .test-item.skipped {{
            border-left-color: #ffc107;
        }}
        
        .failure-details {{
            margin-top: 10px;
            padding: 10px;
            background: #fff5f5;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            overflow-x: auto;
        }}
        
        .timestamp {{
            color: #6c757d;
            font-size: 0.9em;
        }}
        
        .coverage-bar {{
            width: 100%;
            height: 30px;
            background: #e9ecef;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
        }}
        
        .coverage-fill {{
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.3s ease;
        }}
        
        .coverage-text {{
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: bold;
            color: #333;
        }}
    </style>
</head>
<body>
    <h1>🧪 PoliConnect Integration Test Report</h1>
    
    <div class="timestamp">
        Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    </div>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Total Tests</div>
                <div class="stat-value">{total_tests}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Passed</div>
                <div class="stat-value passed">{passed}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Failed</div>
                <div class="stat-value failed">{failed}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Skipped</div>
                <div class="stat-value skipped">{skipped}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Pass Rate</div>
                <div class="stat-value">{pass_rate:.1f}%</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Duration</div>
                <div class="stat-value">{test_data['duration']:.2f}s</div>
            </div>
        </div>
        
        <h3>Code Coverage</h3>
        <div class="coverage-bar">
            <div class="coverage-fill" style="width: {coverage_percent:.1f}%"></div>
            <div class="coverage-text">{coverage_percent:.1f}%</div>
        </div>
    </div>
    
    <div class="test-results">
        <h2>Test Results by Module</h2>
        
        {generate_test_details(test_data['tests'])}
    </div>
    
    <div class="test-results">
        <h2>Failure Analysis</h2>
        
        {generate_failure_analysis(test_data['tests'])}
    </div>
    
    <div class="test-results">
        <h2>Performance Metrics</h2>
        
        {generate_performance_metrics(test_data['tests'])}
    </div>
    
    <div class="test-results">
        <h2>Recommendations</h2>
        
        {generate_recommendations(test_data, coverage_data)}
    </div>
</body>
</html>
"""
    
    return html_content


def generate_test_details(tests):
    """Generate detailed test results HTML"""
    html_parts = []
    
    # Group tests by class
    test_groups = {}
    for test in tests:
        class_name = test['nodeid'].split('::')[1] if '::' in test['nodeid'] else 'Unknown'
        if class_name not in test_groups:
            test_groups[class_name] = []
        test_groups[class_name].append(test)
    
    for class_name, class_tests in test_groups.items():
        html_parts.append(f'<h3>{class_name}</h3>')
        
        for test in class_tests:
            outcome = test['outcome']
            test_name = test['nodeid'].split('::')[-1]
            duration = test.get('duration', 0)
            
            html_parts.append(f'''
            <div class="test-item {outcome}">
                <strong>{test_name}</strong>
                <span style="float: right; color: #6c757d;">{duration:.3f}s</span>
                <div style="color: #6c757d; font-size: 0.9em;">
                    Status: <span class="{outcome}">{outcome.upper()}</span>
                </div>
            </div>
            ''')
    
    return '\n'.join(html_parts)


def generate_failure_analysis(tests):
    """Generate failure analysis HTML"""
    html_parts = []
    
    failed_tests = [t for t in tests if t['outcome'] == 'failed']
    
    if not failed_tests:
        return '<p>No failures detected! 🎉</p>'
    
    for test in failed_tests:
        test_name = test['nodeid']
        error_message = test.get('call', {}).get('longrepr', 'No error details available')
        
        # Extract the most relevant error info
        if isinstance(error_message, str):
            error_lines = error_message.split('\n')
            # Try to find the actual assertion or error
            relevant_lines = []
            for i, line in enumerate(error_lines):
                if 'AssertionError' in line or 'Error' in line or '>' in line:
                    relevant_lines.extend(error_lines[max(0, i-2):i+3])
            
            if relevant_lines:
                error_message = '\n'.join(relevant_lines[-10:])  # Last 10 relevant lines
        
        html_parts.append(f'''
        <div class="test-item failed">
            <strong>{test_name}</strong>
            <div class="failure-details">
{html.escape(str(error_message))}
            </div>
        </div>
        ''')
    
    return '\n'.join(html_parts)


def generate_performance_metrics(tests):
    """Generate performance metrics HTML"""
    # Sort tests by duration
    sorted_tests = sorted(tests, key=lambda t: t.get('duration', 0), reverse=True)
    
    html_parts = ['<h3>Slowest Tests</h3>']
    
    for test in sorted_tests[:10]:  # Top 10 slowest
        test_name = test['nodeid'].split('::')[-1]
        duration = test.get('duration', 0)
        
        if duration > 1.0:  # Highlight tests taking more than 1 second
            color = '#dc3545'
        elif duration > 0.5:
            color = '#ffc107'
        else:
            color = '#28a745'
        
        html_parts.append(f'''
        <div class="test-item">
            <strong>{test_name}</strong>
            <span style="float: right; color: {color}; font-weight: bold;">{duration:.3f}s</span>
        </div>
        ''')
    
    return '\n'.join(html_parts)


def generate_recommendations(test_data, coverage_data):
    """Generate recommendations based on test results"""
    recommendations = []
    
    # Based on pass rate
    pass_rate = (test_data['summary'].get('passed', 0) / test_data['summary']['total'] * 100)
    if pass_rate < 80:
        recommendations.append("⚠️ <strong>Low pass rate:</strong> Focus on fixing failing tests before adding new features.")
    
    # Based on coverage
    if coverage_data:
        coverage_percent = coverage_data['totals']['percent_covered']
        if coverage_percent < 70:
            recommendations.append("📊 <strong>Low coverage:</strong> Consider adding more integration tests for uncovered modules.")
    
    # Based on test duration
    total_duration = test_data['duration']
    if total_duration > 300:  # 5 minutes
        recommendations.append("⏱️ <strong>Long test duration:</strong> Consider optimizing slow tests or running them in parallel.")
    
    # Based on failures
    failed_count = test_data['summary'].get('failed', 0)
    if failed_count > 0:
        recommendations.append(f"🔧 <strong>{failed_count} failing tests:</strong> Review failure analysis and fix critical issues first.")
    
    if not recommendations:
        recommendations.append("✅ <strong>Great job!</strong> All metrics look good. Keep maintaining test quality.")
    
    return '<ul>' + '\n'.join(f'<li>{rec}</li>' for rec in recommendations) + '</ul>'


def main():
    """Main function to generate the report"""
    print("🚀 Running integration tests...")
    
    # Create reports directory
    Path('reports').mkdir(exist_ok=True)
    
    # Run tests
    returncode, stdout, stderr = run_tests_with_json_report()
    
    # Parse results
    test_data = parse_json_report()
    coverage_data = parse_coverage_report()
    
    if not test_data:
        print("❌ Failed to generate test report. Check if tests ran successfully.")
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        return
    
    # Generate HTML report
    html_report = generate_html_report(test_data, coverage_data)
    
    # Save report
    report_path = 'reports/integration_test_report.html'
    with open(report_path, 'w') as f:
        f.write(html_report)
    
    print(f"✅ Report generated: {report_path}")
    print(f"📊 Pass rate: {(test_data['summary'].get('passed', 0) / test_data['summary']['total'] * 100):.1f}%")
    print(f"📈 Coverage: {coverage_data['totals']['percent_covered']:.1f}%" if coverage_data else "Coverage data not available")


if __name__ == '__main__':
    main()