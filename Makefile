# Variables
PORT     ?= 8085
KUBECTL  = kubectl -n default
NS ?= ms-starter
CONCURRENCY ?= 20
DURATION ?= 240
# -------------------------------------------------------------------
# Docker targets
# -------------------------------------------------------------------
.PHONY: docker-build docker-up docker-down

docker-build:
	docker compose build

docker-up:
	docker compose up --build

docker-down:
	docker compose down

# -------------------------------------------------------------------
# Kubernetes (prod) targets
# -------------------------------------------------------------------
.PHONY: k8s-live k8s-build k8s-up k8s-deploy k8s-forward \
        k8s-watch k8s-pods k8s-hpa k8s-delete k8s-status \
        k8s-logs k8s-shell k8s-forward-service

k8s-live:
	make k8s-build
	make k8s-deploy
	make k8s-forward PORT=$(PORT)

k8s-build:
	docker compose -f docker-compose-prod.yml build

k8s-up:
	docker compose -f docker-compose-prod.yml up --build

k8s-deploy:
	kubectl apply -f infra/k8s/

k8s-forward:
	kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller $(PORT):80

k8s-watch:
	kubectl -n ms-starter get pods -w

k8s-pods:
	kubectl -n ms-starter get pods -w

k8s-hpa:
	kubectl -n ms-starter get hpa -w

k8s-delete:
	kubectl delete -f infra/k8s/
	pkill -f "kubectl.*port-forward" || true
# 	kubectl delete all --all

k8s-delete-no-db:
	kubectl delete deployment,service,ingress -n $(NS) --all --ignore-not-found
	pkill -f "kubectl.*port-forward" || true

k8s-kill:
	pkill -f "kubectl.*port-forward" || true

k8s-status:
	kubectl -n ms-starter get all

k8s-logs:
	kubectl -n ms-starter logs -f $$(kubectl -n ms-starter get pods -o name | head -n 1)

k8s-shell:
	kubectl -n ms-starter exec -it $$(kubectl -n ms-starter get pods -o name | head -n 1) -- /bin/sh

k8s-forward-service:
	-kubectl -n ms-starter port-forward svc/api-node      4005:4005 &
	-kubectl -n ms-starter port-forward svc/api-python    5005:5005 &
	-kubectl -n ms-starter port-forward svc/web-frontend  5173:80 &

# -------------------------------------------------------------------
# Monitoring & load testing
# -------------------------------------------------------------------
.PHONY: port-forward-lgtm load-test

port-forward-lgtm:
	$(KUBECTL) port-forward svc/grafana     33005:3000 &
	$(KUBECTL) port-forward svc/loki        33105:3100 &
	$(KUBECTL) port-forward svc/prometheus  9097:9090 &

load-test:
	npx autocannon -c $(CONCURRENCY) -d $(DURATION) http://127.0.0.1.nip.io:8085/api-node/api/users & \
	npx autocannon -c $(CONCURRENCY) -d $(DURATION) http://127.0.0.1.nip.io:8085/api-python/api/items & \
	npx autocannon -c $(CONCURRENCY) -d $(DURATION) http://127.0.0.1.nip.io:8085/api-go/api/products & \
	wait