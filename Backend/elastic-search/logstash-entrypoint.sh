#!/bin/bash
set -e

# Start logstash in background
/usr/local/bin/docker-entrypoint &
LOGSTASH_PID=$!

# Wait for logstash TCP port to be ready
echo "Waiting for Logstash to start..."
for i in {1..120}; do
    if timeout 1 bash -c "</dev/tcp/localhost/5044" 2>/dev/null; then
        echo "Logstash is ready!"
        touch /tmp/logstash.ready
        break
    fi
    sleep 1
done

# Keep the script running
wait $LOGSTASH_PID
