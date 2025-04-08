build:
	docker-compose up --build -d

start: 
	docker-compose start

stop:
	docker-compose stop

clean:
	docker-compose down --rmi all -v

install_poetry:
	brew install pipx
	pipx ensurepath
	pipx install poetry==1.8.4

poetry_start:
	cd backend && poetry config virtualenvs.in-project true

poetry_install:
	cd backend && poetry install --no-interaction -v --no-cache --no-root

poetry_update:
	cd backend && poetry update

push: 
	docker build --platform=linux/amd64 -f Dockerfile.frontend -t technical-manual-embeddings-front .
	docker tag technical-manual-embeddings-front gcr.io/manufacturing-project-425012/technical-manual-embeddings-front
	docker push gcr.io/manufacturing-project-425012/technical-manual-embeddings-front
	docker build --platform=linux/amd64 -f Dockerfile.backend -t technical-manual-embeddings-back .
	docker tag technical-manual-embeddings-back gcr.io/manufacturing-project-425012/technical-manual-embeddings-back
	docker push gcr.io/manufacturing-project-425012/technical-manual-embeddings-back

deploy-back: 
	gcloud run deploy technical-manual-embeddings-back \
	    --project manufacturing-project-425012 \
	    --platform managed \
		--region us-central1 \
		--allow-unauthenticated \
        --image='gcr.io/manufacturing-project-425012/technical-manual-embeddings-back' \
		--port='8000' \
		--set-env-vars MONGODB_URI="mongodb+srv://manudemouser:demopwuns90@ist-shared.n0kts.mongodb.net/",DATABASE_NAME="car_assistant_demo",CHUNKS_COLLECTION="manuals",GCP_PROJECT_ID="manufacturing-project-425012",GCP_LOCATION="us-central1",ORIGINS="*",DEBUG="False",VECTOR_INDEX_NAME="manual_vector_index",VECTOR_FIELD_NAME="embedding",EMBEDDINGS_MODEL_ID="text-embedding-005"

deploy-front:
	gcloud run deploy technical-manual-embeddings-front \
	    --project manufacturing-project-425012 \
	    --platform managed \
		--region us-central1 \
		--allow-unauthenticated \
		--image='gcr.io/manufacturing-project-425012/technical-manual-embeddings-front' \
		--set-env-vars DB_NAME="car_assistant_demo",COLLECTION_NAME="manuals",NEXT_PUBLIC_API_URL="https://technical-manual-embeddings-back-362614368442.us-central1.run.app/api/v1" \
        --port='3000'