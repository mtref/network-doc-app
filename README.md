
For network-doc-app
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)

docker buildx build --platform linux/amd64 -t network-doc-app:latest --load .
docker save -o network-doc-app-image.tar network-doc-app:latest


Migrate database
docker-compose down --volumes --rmi all &&
rm -rf backend/migrations/ &&
docker-compose run --rm backend flask db init &&
docker-compose run --rm backend flask db migrate -m "Initial schema setup with all models and fields" &&
docker-compose run --rm backend flask db upgrade &&
docker-compose up -d --build


==
docker-compose down --volumes --rmi all
rm -rf backend/migrations/

cd backend/
source venv/bin/activate

export FLASK_APP=app.py
python -m flask db init
python -m flask db migrate -m "Initial migration"
deactivate
cd ..
docker-compose up --build


