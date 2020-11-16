FROM postgres:13

COPY ./docker/postgres/server.crt /var/lib/postgresql/server.crt
COPY ./docker/postgres/server.key /var/lib/postgresql/server.key

RUN chmod 600 /var/lib/postgresql/server.*
RUN chown postgres /var/lib/postgresql/server.*