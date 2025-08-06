#!/bin/bash

# MJ-5890K Thermal Printer Script
# Usage: ./print_receipt.sh maxdFCo2 co2Threshold

MAX_DFC02=$1
MAX_CO2=$2
READING=$3
case $READING in
    1)
         MESSAGE="Dormant Vitality"
         ;;
    2)
         MESSAGE="Conditioned Flow"
         ;;
    3)
         MESSAGE="Disciplined Pulse"
         ;;
    4)
         MESSAGE="Expressive Prana"
         ;;
    5)
         MESSAGE="Radiant Overflow"
         ;;
esac

PRINTER_DEVICE="/dev/usb/lp0"
{
    echo -e "\x1B@"                    # Initialize
    echo -e "\x1Ba\x01"               # Center align
    echo -e "\x1B!\x30"               # Large text
    echo "SENSING PRANA"
    echo -e "\x1B!\x00"               # Normal text
    echo "Between Presence, Data,"
    echo "and Prediction"
    echo "---------------------"
    echo -e "\x1Ba\x00"               # Left align
    echo "Max CO2 Change: ${MAX_DFC02} ppm"
    echo "Highest total CO2: ${MAX_CO2} ppm"
    echo "Reflection of your breath:"
    echo "$MESSAGE"
    echo -e "\x1Ba\x01" #center align
    echo "---------------------"
    echo -e "\x1Ba\x00"  #left align
    echo "DISCLAIMER:"
    echo "This is NOT a diagnosis."
    echo "Your breath is NOT a number."
    echo "This printout is a reflection..."
    echo "Not a judgement."
    echo -e "\n"
    echo "It's a mirror- one of many."
    echo "Take it lightly."
    echo "Or take a breath."
    echo -e "\x1DV\x41\x03"           # Cut paper
    echo -e "\n"
} > $PRINTER_DEVICE

echo "Receipt printed successfully"
