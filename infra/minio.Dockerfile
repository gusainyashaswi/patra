# Build pinned upstream releases: their old public registry tags may disappear.
FROM golang:1.24-alpine AS build
RUN apk add --no-cache git
ENV CGO_ENABLED=0 GODEBUG=http2client=0
RUN go install github.com/minio/minio@RELEASE.2025-04-22T22-12-26Z
RUN go install github.com/minio/mc@RELEASE.2025-04-16T18-13-26Z
FROM alpine:3.21 AS base
RUN apk add --no-cache ca-certificates
FROM base AS server
COPY --from=build /go/bin/minio /usr/local/bin/minio
ENTRYPOINT ["/usr/local/bin/minio"]
FROM base AS client
COPY --from=build /go/bin/mc /usr/local/bin/mc
ENTRYPOINT ["/usr/local/bin/mc"]
