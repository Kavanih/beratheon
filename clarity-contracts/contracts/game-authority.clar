;; game-authority.clar
;; Authoritative game settler. All gameplay mutations flow through here.
;; Requires signed payloads from backend game-signer.

(define-constant NONCE_USED u1)

(define-data-var owner principal tx-sender)
(define-data-var game-signer-pubkey (buff 33) 0x000000000000000000000000000000000000000000000000000000000000000000)

(define-map used-nonces (buff 32) bool)

(define-private (emit-loot-grant (recipient principal) (items (list 100 { token-id: uint, qty: uint })))
  (print {
    event: "loot-grant",
    recipient: recipient,
    items: items
  })
)

(define-private (emit-honey-grant (recipient principal) (amount uint))
  (print {
    event: "honey-grant",
    recipient: recipient,
    amount: amount
  })
)

(define-private (emit-juice-grant (recipient principal) (amount uint))
  (print {
    event: "juice-grant",
    recipient: recipient,
    amount: amount
  })
)

;; Verify secp256k1 signature
(define-private (verify-signature (message (buff 32)) (signature (buff 65)) (pubkey (buff 33)))
  (is-eq (secp256k1-recover? message signature) (ok pubkey))
)

;; Grant loot (items-sft) to recipient
(define-public (grant-loot (recipient principal) (items (list 100 { token-id: uint, qty: uint })))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) (err u1))
    (asserts! (> (len items) u0) (err u2))
    (fold grant-loot-item items (ok true))
  )
)

(define-private (grant-loot-item (item { token-id: uint, qty: uint }) (result (response bool uint)))
  (match result
    ok-val (contract-call? .items-sft mint (get token-id item) tx-sender (get qty item))
    err-val (err err-val)
  )
)

;; Grant honey token
(define-public (grant-honey (recipient principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) (err u1))
    (asserts! (> amount u0) (err u3))
    (try! (contract-call? .honey-token mint recipient amount))
    (emit-honey-grant recipient amount)
    (ok true)
  )
)

;; Grant juice token
(define-public (grant-juice (recipient principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) (err u1))
    (asserts! (> amount u0) (err u3))
    (try! (contract-call? .juice-token mint recipient amount))
    (emit-juice-grant recipient amount)
    (ok true)
  )
)

;; Settle dungeon run with signed payload
;; Prevents replay via nonce map
(define-public (settle-dungeon-run
  (run-hash (buff 32))
  (recipient principal)
  (loot (list 100 { token-id: uint, qty: uint }))
  (scrap-amount uint)
  (signature (buff 65))
  (pubkey (buff 33))
)
  (begin
    (asserts! (is-none (map-get? used-nonces run-hash)) (err u4))
    (let ((message run-hash))
      (asserts! (verify-signature message signature pubkey) (err u5))
      (asserts! (is-eq pubkey (var-get game-signer-pubkey)) (err u6))
      (map-set used-nonces run-hash true)
      (try! (grant-honey recipient scrap-amount))
      (try! (fold grant-loot-item loot (ok true)))
      (ok true)
    )
  )
)

;; Settle fishing cast with signed payload
(define-public (settle-fishing-cast
  (cast-hash (buff 32))
  (recipient principal)
  (fish-id uint)
  (qty uint)
  (signature (buff 65))
  (pubkey (buff 33))
)
  (begin
    (asserts! (is-none (map-get? used-nonces cast-hash)) (err u4))
    (let ((message cast-hash))
      (asserts! (verify-signature message signature pubkey) (err u5))
      (asserts! (is-eq pubkey (var-get game-signer-pubkey)) (err u6))
      (map-set used-nonces cast-hash true)
      (try! (contract-call? .items-sft mint fish-id recipient qty))
      (ok true)
    )
  )
)

;; Settle craft with signed payload
(define-public (settle-craft
  (craft-hash (buff 32))
  (recipe-id uint)
  (recipient principal)
  (inputs (list 10 { token-id: uint, qty: uint }))
  (outputs (list 10 { token-id: uint, qty: uint }))
  (signature (buff 65))
  (pubkey (buff 33))
)
  (begin
    (let ((message craft-hash))
      (asserts! (verify-signature message signature pubkey) (err u5))
      (asserts! (is-eq pubkey (var-get game-signer-pubkey)) (err u6))
      (try! (fold burn-craft-input inputs (ok true)))
      (ok true)
    )
  )
)

(define-private (burn-craft-input (item { token-id: uint, qty: uint }) (result (response bool uint)))
  (match result
    ok-val (contract-call? .items-sft burn (get token-id item) (get qty item))
    err-val (err err-val)
  )
)

;; Admin: set game-signer (backend multisig)
(define-public (set-game-signer (new-pubkey (buff 33)))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) (err u1))
    (var-set game-signer-pubkey new-pubkey)
    (ok true)
  )
)

;; Admin: set owner
(define-public (set-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) (err u1))
    (var-set owner new-owner)
    (ok true)
  )
)

(ok true)
