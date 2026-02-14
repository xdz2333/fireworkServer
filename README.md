采用flask+uwsgi+sqlite3配置，然后uwsgi --ini config.ini就可以运行，但是要把nginx.conf里面的server块，还有config.ini里面的serverPath改成服务器目录
