#!/bin/bash

until curl -s -u elastic:${ELASTIC_PASSWORD} http://localhost:9200/ | grep -q "number"; do
  sleep 5
done

curl -u elastic:${ELASTIC_PASSWORD} -X PUT "http://localhost:9200/_security/role/logstash_writer" -H 'Content-Type: application/json' -d'
{
  "cluster": ["monitor", "manage_index_templates", "manage_ilm"],
  "indices": [
    {
      "names": ["*log*", "*-logs*", "*"],
      "privileges": ["create_index", "write", "delete", "index", "create", "manage", "all"]
    }
  ]
}
'

curl -u elastic:${ELASTIC_PASSWORD} -X POST "http://localhost:9200/_security/user/logstash_system/_password" -H 'Content-Type: application/json' -d'
{
  "password": "'"${LOGSTASH_SYSTEM_PASSWORD}"'"
}
'

curl -u elastic:${ELASTIC_PASSWORD} -X POST "http://localhost:9200/_security/user/logstash_writer_user" -H 'Content-Type: application/json' -d'
{
  "password": "${LOGSTASH_WRITER_PASSWORD}",
  "roles": ["logstash_writer"],
  "full_name": "Logstash Writer"
}
'

curl -u elastic:${ELASTIC_PASSWORD} -X PUT "http://localhost:9200/_ilm/policy/log_retention_policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_size": "25GB",
            "max_age": "30d"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'


curl -u elastic:${ELASTIC_PASSWORD} -X PUT "http://localhost:9200/_index_template/logs_template" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["*-logs*"],
  "priority": 10,
  "template": {
    "settings": {
      "index.lifecycle.name": "log_retention_policy",
      "index.lifecycle.rollover_alias": "logs",
      "index.number_of_replicas": 0
    }
  }
}'

curl -u elastic:${ELASTIC_PASSWORD} -X PUT "http://localhost:9200/_snapshot/backup_repository" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backups"
  }
}'

echo "Elasticsearch roles, policies and templates initialized successfully."