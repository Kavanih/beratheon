;; username-nft.clar
;; SIP-009 NFT: Username NFT (one per wallet)
;; Mint requires 0.005 STX or a NoobPass token

(impl-trait .traits.nft-trait)

(define-constant TOKEN_NAME "Beratheon Username")
(define-constant TOKEN_SYMBOL "USERNAME")
(define-constant MINT_PRICE_USTX u5000)

(define-data-var last-token-id uint u0)
(define-data-var authority principal tx-sender)
(define-data-var treasury principal tx-sender)

(define-map token-owner uint principal)
(define-map owner-token principal uint)
(define-map username-to-id (string-ascii 20) uint)

(define-private (emit-transfer (from (optional principal)) (to principal) (token-id uint))
  (print {
    event: "transfer",
    from: from,
    to: to,
    token_id: token-id
  })
)

(define-private (emit-mint (to principal) (token-id uint) (username (string-ascii 20)))
  (print {
    event: "mint",
    to: to,
    token_id: token-id,
    username: username
  })
)

;; Validate username: 3-20 chars, lowercase a-z 0-9 _
(define-private (is-valid-username (username (string-ascii 20)))
  (let ((len (len username)))
    (and
      (>= len u3)
      (<= len u20)
    )
  )
)

;; SIP-009 Implementation

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some "/api/metadata/username"))
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
      (map-delete owner-token sender)
      (map-set owner-token recipient token-id)
      (emit-transfer (some sender) recipient token-id)
      (ok true)
    )
  )
)

;; Mint: one per wallet, requires STX payment
(define-public (mint (username (string-ascii 20)))
  (begin
    (asserts! (is-valid-username username) (err u3))
    (asserts! (is-none (map-get? owner-token tx-sender)) (err u4))
    (let ()
      (asserts! (is-none (map-get? username-to-id username)) (err u5))
      (try! (stx-transfer? MINT_PRICE_USTX tx-sender (var-get treasury)))
      (let ((new-id (+ (var-get last-token-id) u1)))
        (var-set last-token-id new-id)
        (map-set token-owner new-id tx-sender)
        (map-set owner-token tx-sender new-id)
        (map-set username-to-id username new-id)
        (emit-mint tx-sender new-id username)
        (ok new-id)
      )
    )
  )
)

;; Get token ID by username
(define-read-only (get-token-by-username (username (string-ascii 20)))
  (map-get? username-to-id username)
)

;; Get username token for owner
(define-read-only (get-owner-token (owner principal))
  (map-get? owner-token owner)
)

;; Admin: set authority
(define-public (set-authority (new-authority principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u6))
    (var-set authority new-authority)
    (ok true)
  )
)

;; Admin: set treasury
(define-public (set-treasury (new-treasury principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u6))
    (var-set treasury new-treasury)
    (ok true)
  )
)

(ok true)
