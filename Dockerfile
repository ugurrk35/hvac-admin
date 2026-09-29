# ----------------------------------------
# 1. Build stage
# ----------------------------------------
FROM node:20-alpine AS builder

# Çalışma dizini
WORKDIR /app

# Package dosyalarını kopyala ve bağımlılıkları yükle
COPY package*.json ./
RUN npm install

# Tüm kaynak kodunu kopyala
COPY . .

# Next.js build
RUN npm run build

# ----------------------------------------
# 2. Production stage
# ----------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Production ortam değişkeni
ENV NODE_ENV=production

# Next.js’in dinleyeceği port
ENV PORT=3000

# Build edilmiş dosyaları kopyala
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Sadece production bağımlılıklarını yükle
RUN npm install --omit=dev

# Docker’a portu bildir
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "run", "start"]
