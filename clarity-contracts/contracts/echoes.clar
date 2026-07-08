;; echoes.clar
;; Commit-reveal system for player echoes
;; Players commit echo snapshots; backend reveals in dungeon encounters

(define-data-var authority principal tx-sender)
(define-data-var bounty-amount uint u1000000)

(define-map echo-commits principal (buff 32))
(define-map echo-revealed principal bool)

(define-private (emit-echo-commit (player principal) (hash (buff 32)))
  (print {
    event: "echo-commit",
    player: player,
    hash: hash
  })
)

(define-private (emit-echo-reveal (player principal) (defeated bool))
  (print {
    event: "echo-reveal",
    player: player,
    defeated: defeated
  })
)

;; Commit echo snapshot hash
(define-public (commit-echo (hash (buff 32)))
  (begin
    (asserts! (> (len hash) u0) (err u1))
    (map-set echo-commits tx-sender hash)
    (emit-echo-commit tx-sender hash)
    (ok true)
  )
)

;; Reveal echo and pay bounty if defeated
(define-public (reveal-echo (player principal) (defeated bool))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u2))
    (asserts! (is-some (map-get? echo-commits player)) (err u3))
    (asserts! (is-none (map-get? echo-revealed player)) (err u4))
    (map-set echo-revealed player true)
    (try! (if defeated
      (contract-call? .honey-token mint player (var-get bounty-amount))
      (ok true)
    ))
    (emit-echo-reveal player defeated)
    (ok true)
  )
)

;; Get player's committed echo hash
(define-read-only (get-echo-commit (player principal))
  (map-get? echo-commits player)
)

;; Check if echo has been revealed
(define-read-only (is-echo-revealed (player principal))
  (is-some (map-get? echo-revealed player))
)

;; Admin: set bounty amount
(define-public (set-bounty-amount (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u2))
    (asserts! (> amount u0) (err u5))
    (var-set bounty-amount amount)
    (ok true)
  )
)

;; Admin: set authority
(define-public (set-authority (new-authority principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u2))
    (var-set authority new-authority)
    (ok true)
  )
)

(ok true)
