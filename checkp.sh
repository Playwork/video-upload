#!/bin/sh
NODE_PATH="/app/video-upload/server.js"
LOG_PATH="/var/log/video-upload/log"
DATE=`date '+%Y-%m-%d %H:%M:%S'`
RUNNING=$(ps -ef | grep "$NODE_PATH" | grep -v grep | wc -l)

if [ $RUNNING -eq 1 ];
        then
                echo "$NODE_PATH $DATE" >> $LOG_PATH/success
        else
                echo "$NODE_PATH $DATE" >> $LOG_PATH/error
        fi

