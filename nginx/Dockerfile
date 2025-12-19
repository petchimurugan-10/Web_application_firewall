FROM owasp/modsecurity-crs:nginx

USER root
RUN mkdir -p /var/log/modsecurity && chown -R nginx:nginx /var/log/modsecurity
USER nginx

COPY default.conf /etc/nginx/templates/conf.d/default.conf.template

# Custom ModSecurity rules
COPY modsecurity /etc/nginx/modsecurity

