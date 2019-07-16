#!/bin/sh
#
# Usage: lldpmud {MURURL}

mudurl=$1 # see?

# let's do a bit of validation on this thing

echo $mudurl| egrep '^https://' > /dev/null 2>&1

if [ $? != 0 ]; then
  echo "0: invalid MUDURL $mudurl"
  echo "$0: correct form:  https://domain/..."
  exit
fi

odval=`echo $1 |od -A n -t x1 -w1024 | sed -e 's/^ //' -e 's/ /,/g'`

lldpcli=`which lldpcli`

if [ $? != 0 ]; then
  "$0: lldpcli not found"
  exit -1
fi

$lldpcli configure lldp custom-tlv add oui 00,00,5e subtype 01 oui-info $odval
 
