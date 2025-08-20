docker-up:
	docker compose up --build

docker-down:
	docker compose down

k8s-up:
	docker compose -f docker-compose-prod.yml up --build

k8s-deploy:
	kubectl apply -f infra/k8s/

PORT ?= 8085

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
	pkill -f "kubectl port-forward"
# 	kubectl delete all --all

k8s-status:
	kubectl -n ms-starter get all

k8s-logs:
	kubectl -n ms-starter logs -f $$(kubectl -n ms-starter get pods -o name | head -n 1)

k8s-shell:
	kubectl -n ms-starter exec -it $$(kubectl -n ms-starter get pods -o name | head -n 1) -- /bin/sh

k8s-forward-service:
	-kubectl -n ms-starter port-forward svc/api-node 4005:4005 &
	-kubectl -n ms-starter port-forward svc/api-python 5005:5005 &
	-kubectl -n ms-starter port-forward svc/web-frontend 5173:80 &