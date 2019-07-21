# builder
FROM python:3.7-slim AS build-env
RUN mkdir -p /app/muddy-api
RUN mkdir -p /build/muddy-api
RUN mkdir /init
COPY requirements.txt /build/muddy-api/requirements.txt
ADD . /app/muddy-api

RUN pip3 install --upgrade pip --trusted-host pypi.org --trusted-host files.pythonhosted.org
RUN pip install -r /build/muddy-api/requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org

RUN cp /usr/local/bin/gunicorn /init/gunicorn
RUN chmod +x /init/gunicorn
RUN rm -rf /app/muddy-api/Dockerfile

# actual image
FROM gcr.io/distroless/python3
COPY --from=build-env /app /app
COPY --from=build-env /usr/local/lib/python3.7/site-packages /usr/local/lib/python3.7/site-packages
COPY --from=build-env /init /init
WORKDIR /app/muddy-api

EXPOSE 8000
ENV PYTHONPATH=/usr/local/lib/python3.7/site-packages
ENV APP_SETTINGS=development

CMD ["/init/gunicorn", "run:app", "--bind", "0.0.0.0:8000", "--workers", "3", "--preload"]