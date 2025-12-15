#!/usr/bin/env python3
"""
Example chart script that generates a velocity chart from CSV flight data.
"""
import os
import sys
import pandas as pd
import plotly.graph_objects as go

def main():
    # Get environment variables
    flight_id = os.getenv('FLIGHT_ID')
    flight_dir = os.getenv('FLIGHT_DIR')
    flight_charts_dir = os.getenv('FLIGHT_CHARTS_DIR')
    csv_files_str = os.getenv('CSV_FILES', '')
    
    if not csv_files_str:
        print("No CSV files provided", file=sys.stderr)
        sys.exit(1)
    
    csv_files = csv_files_str.split(',')
    
    # Process all CSV files
    all_data = []
    for csv_file in csv_files:
        if os.path.exists(csv_file):
            try:
                df = pd.read_csv(csv_file)
                all_data.append(df)
            except Exception as e:
                print(f"Error reading {csv_file}: {e}", file=sys.stderr)
    
    if not all_data:
        print("No valid CSV data found", file=sys.stderr)
        sys.exit(1)
    
    # Combine all data
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Try to find velocity column
    velocity_col = None
    for col in combined_df.columns:
        if col.lower() in ['velocity', 'vel', 'speed', 'v', 'airspeed']:
            velocity_col = col
            break
    
    if velocity_col is None:
        print("No velocity column found in CSV data", file=sys.stderr)
        sys.exit(1)
    
    # Try to find time column
    time_col = None
    for col in combined_df.columns:
        if col.lower() in ['time', 'timestamp', 't', 'elapsed_time', 'elapsed']:
            time_col = col
            break
    
    # Create the chart
    fig = go.Figure()
    
    if time_col:
        fig.add_trace(go.Scatter(
            x=combined_df[time_col],
            y=combined_df[velocity_col],
            mode='lines+markers',
            name='Velocity',
            line=dict(color='red', width=2),
            marker=dict(size=4)
        ))
        fig.update_xaxes(title_text=time_col)
    else:
        fig.add_trace(go.Scatter(
            y=combined_df[velocity_col],
            mode='lines+markers',
            name='Velocity',
            line=dict(color='red', width=2),
            marker=dict(size=4)
        ))
        fig.update_xaxes(title_text='Sample')
    
    fig.update_yaxes(title_text=f'Velocity ({velocity_col})')
    fig.update_layout(
        title='Flight Velocity Profile',
        hovermode='x unified',
        template='plotly_white'
    )
    
    # Save chart
    chart_filename = 'velocity_chart.html'
    chart_path = os.path.join(flight_charts_dir, chart_filename)
    fig.write_html(chart_path)
    
    # Output filename for the API to track
    print(chart_filename)

if __name__ == '__main__':
    main()

