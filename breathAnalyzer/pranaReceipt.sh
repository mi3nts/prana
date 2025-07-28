#!/bin/bash

# MJ-5890K Thermal Printer Script
# Usage: ./print_receipt.sh maxdFCo2 co2Threshold

MAX_DFC02=$1
CO2_THRESHOLD=$2

# Printer device (adjust path as needed)
PRINTER_DEVICE="/dev/usb/lp0"  # or /dev/ttyACM0, check with 'ls /dev/tty*'

{
    echo -e '\n\n\n'
    echo -e "\x1B@"                    # Initialize
    echo -e "\x1Ba\x01"               # Center align
    echo -e "\x1B!\x30"               # Large text
    echo "PRANA READING"
    echo -e "\x1B!\x00"               # Normal text
    echo ""
    echo -e "\x1Ba\x00"               # Left align
    echo "Max CO2 Change: ${MAX_DFC02}"
    echo "CO2 Threshold: ${CO2_THRESHOLD}"
    echo ""
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "\x1DV\x41\x03"           # Cut paper
    echo -e "\n\n\n"
} > $PRINTER_DEVICE

echo "Receipt printed successfully"