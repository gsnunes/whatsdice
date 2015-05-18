#!/bin/sh

echo $WERCKER_DEPLOYTARGET_NAME

#if [ "$WERCKER_DEPLOYTARGET_NAME" = "dev" ]; then
	#sed -i 's!192.168.56.101!test.hangoutsplay.com!g' app.xml
	scp -i $PRIVATEKEY_PATH README.md root@104.236.20.173:/var/www/whatsdice.com
#fi