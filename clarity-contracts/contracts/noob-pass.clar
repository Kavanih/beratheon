;; noob-pass.clar
;; SIP-009 NFT: Cub Pass (early-access NFT)
;; Fixed mint 1024. Whitelist via merkle root.

(impl-trait .traits.nft-trait)

(define-constant TOKEN_NAME "Beratheon Cub Pass")
(define-constant TOKEN_SYMBOL "CUBPASS")
(define-constant MAX_SUPPLY u1024)

(define-data-var last-token-id uint u0)
(define-data-var authority principal tx-sender)
(define-data-var merkle-root (optional (buff 32)) none)

(define-map token-owner uint principal)
(define-map claimed principal bool)

(define-private (emit-transfer (from (optional principal)) (to principal) (token-id uint))
  (print {
    event: "transfer",
    from: from,
    to: to,
    token_id: token-id
  })
)

(define-private (emit-mint (to principal) (token-id uint))
  (print {
    event: "mint",
    to: to,
    token_id: token-id
  })
)

;; SIP-009 Implementation

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some "/api/metadata/cubpass"))
)

(define-read-only (get-owner (token-id uint))
  (ok (map-get? token-owner token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err u1))
    (let ((current-owner (map-get? token-owner token-id)))
      (asserts! (is-eq current-owner (some sender)) (err u2))
      (map-set token-owner token-id recipient)
      (emit-transfer (some sender) recipient token-id)
      (ok true)
    )
  )
)

;; Mint: one per wallet (merkle whitelist optional via set-merkle-root for future use)
(define-public (mint)
  (begin
    (asserts! (is-none (map-get? claimed tx-sender)) (err u3))
    (let ((new-id (+ (var-get last-token-id) u1)))
      (asserts! (<= new-id MAX_SUPPLY) (err u5))
      (var-set last-token-id new-id)
      (map-set token-owner new-id tx-sender)
      (map-set claimed tx-sender true)
      (emit-mint tx-sender new-id)
      (ok new-id)
    )
  )
)

;; Check if address is whitelisted
(define-read-only (is-claimed (address principal))
  (is-some (map-get? claimed address))
)

;; Admin: set merkle root (one-time)
(define-public (set-merkle-root (root (buff 32)))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u6))
    (asserts! (is-none (var-get merkle-root)) (err u7))
    (var-set merkle-root (some root))
    (ok true)
  )
)

;; Admin: set authority
(define-public (set-authority (new-authority principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u6))
    (var-set authority new-authority)
    (ok true)
  )
)

(ok true)
