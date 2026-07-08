;; cub-nft.clar
;; SIP-009 NFT: Beratheon Hero (Cub)
;; Mintable up to 10,000. Immutable cosmetic traits post-mint.

(impl-trait .traits.nft-trait)

(define-constant MAX_SUPPLY u10000)
(define-constant TOKEN_NAME "Beratheon Cub")
(define-constant TOKEN_SYMBOL "CUB")

(define-data-var last-token-id uint u0)
(define-data-var token-uri-root (optional (string-ascii 256)) none)
(define-data-var authority principal tx-sender)

(define-map token-owner uint principal)
(define-map cub-data uint {
  head: uint,
  body: uint,
  accent: uint,
  born: uint
})

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

;; Deterministic trait generation from block context
(define-private (generate-traits (height uint) (counter uint) (sender principal))
  (let ((mix (+ height counter)))
    {
      head: (mod mix u16),
      body: (mod (* mix counter) u16),
      accent: (mod (+ mix height) u16),
      born: height
    }
  )
)

;; SIP-009 Implementation

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (let ((root (var-get token-uri-root)))
    (match root
      uri (ok (some uri))
      (ok none)
    )
  )
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

;; Mint: restricted to authority
(define-public (mint (to principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u3))
    (let ((new-id (+ (var-get last-token-id) u1)))
      (asserts! (<= new-id MAX_SUPPLY) (err u4))
      (var-set last-token-id new-id)
      (map-set token-owner new-id to)
      (map-set cub-data new-id (generate-traits stacks-block-height new-id to))
      (emit-mint to new-id)
      (ok new-id)
    )
  )
)

;; Get immutable cub traits
(define-read-only (get-cub-data (token-id uint))
  (map-get? cub-data token-id)
)

;; Initialize token URI root (one-time)
(define-public (initialize-uri-root (root (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u3))
    (asserts! (is-none (var-get token-uri-root)) (err u5))
    (var-set token-uri-root (some root))
    (ok true)
  )
)

;; Admin: set authority
(define-public (set-authority (new-authority principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u3))
    (var-set authority new-authority)
    (ok true)
  )
)

(ok true)
