#!/bin/bash

# MJ-5890K Thermal Printer Script
# Usage: ./print_receipt.sh maxdFCo2 co2Threshold

MAX_DFC02=$1
CO2_THRESHOLD=$2

# Printer device (adjust path as needed)
PRINTER_DEVICE="/dev/ttyUSB0"  # or /dev/ttyACM0, check with 'ls /dev/tty*'

# ESC/POS Commands
ESC="\x1B"
GS="\x1D"

# Initialize printer
printf "${ESC}@" > $PRINTER_DEVICE

# Center align
printf "${ESC}a\x01" > $PRINTER_DEVICE

# Large text for header
printf "${ESC}!\x30" > $PRINTER_DEVICE
printf "PRANA READING\n" > $PRINTER_DEVICE

# Normal text
printf "${ESC}!\x00" > $PRINTER_DEVICE
printf "\n" > $PRINTER_DEVICE

# Left align for data
printf "${ESC}a\x00" > $PRINTER_DEVICE

# Print the data
printf "Max CO2 Change: ${MAX_DFC02}\n" > $PRINTER_DEVICE
printf "CO2 Threshold: ${CO2_THRESHOLD}\n" > $PRINTER_DEVICE
printf "\n" > $PRINTER_DEVICE

# Add timestamp
printf "Time: $(date '+%Y-%m-%d %H:%M:%S')\n" > $PRINTER_DEVICE

# Cut paper (if supported)
printf "${GS}V\x41\x03" > $PRINTER_DEVICE

# Feed and cut
printf "\n\n\n" > $PRINTER_DEVICE

echo "Receipt printed successfully"