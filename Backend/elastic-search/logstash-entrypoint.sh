#!/bin/bash
set -e

echo "Waiting for Elasticsearch credentials to be ready..."

until curl -s -u "${LOGSTASH_WRITER_USER}:${LOGSTASH_WRITER_PASSWORD}" http://elasticsearch:9200/ > /dev/null; do
  echo "Elasticsearch is not ready or user not created yet... sleeping"
  sleep 5
done

echo "Credentials validated! Creating healthcheck flag..."

touch /tmp/logstash.ready

echo "Starting Logstash process..."
exec logstash -f /usr/share/logstash/pipeline/logstash.conf