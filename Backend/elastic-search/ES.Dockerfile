FROM docker.elastic.co/elasticsearch/elasticsearch:8.14.0

COPY init-scripts.sh /init-scripts.sh

USER root
RUN chmod +x /init-scripts.sh && \
    chown elasticsearch:elasticsearch /init-scripts.sh

USER elasticsearch