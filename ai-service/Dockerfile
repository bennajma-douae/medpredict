FROM python:latest
WORKDIR /app
RUN pip install flask flask-cors
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]