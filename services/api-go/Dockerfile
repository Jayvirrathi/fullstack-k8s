FROM golang:1.23 as build

WORKDIR /src

# Copy both mod and sum
COPY go.mod go.sum ./
RUN go mod download

# Copy rest of source
COPY . .
RUN CGO_ENABLED=0 go build -o /out/api-go ./cmd/server

FROM gcr.io/distroless/base-debian12
COPY --from=build /out/api-go /api-go
EXPOSE 7000
CMD ["/api-go"]