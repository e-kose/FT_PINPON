#!/bin/bash

# Elasticsearch'in başlamasını bekleyelim
until curl -s -u elastic:${ELASTIC_PASSWORD} http://localhost:9200/ | grep -q "number"; do
  sleep 5
done

# logstash_writer rolünü oluştur
curl -u elastic:${ELASTIC_PASSWORD} -X PUT "http://localhost:9200/_security/role/logstash_writer" -H 'Content-Type: application/json' -d'
{
  "cluster": ["monitor", "manage_index_templates"],
  "indices": [
    {
      "names": ["*log*", "*-logs*", "*-*"],
      "privileges": ["create_index", "write", "delete", "index", "create_doc"]
    }
  ]
}
'

# logstash_system kullanıcısına rolü ata
curl -u elastic:${ELASTIC_PASSWORD} -X POST "http://localhost:9200/_security/user/logstash_system/_roles" -H 'Content-Type: application/json' -d'
{
  "roles": ["logstash_writer", "logstash_system"]
}
'

echo "Elasticsearch roles and permissions initialized successfully."