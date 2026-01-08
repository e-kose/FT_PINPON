FROM docker.elastic.co/logstash/logstash:8.14.0

USER root

COPY logstash.conf /usr/share/logstash/pipeline/logstash.conf
COPY logstash.yml /usr/share/logstash/config/logstash.yml

COPY logstash-entrypoint.sh /usr/local/bin/custom-entrypoint.sh
RUN chmod +x /usr/local/bin/custom-entrypoint.sh && \
    chown logstash:logstash /usr/local/bin/custom-entrypoint.sh

RUN chown logstash:logstash /usr/share/logstash/pipeline/logstash.conf \
    && chown logstash:logstash /usr/share/logstash/config/logstash.yml

USER logstash