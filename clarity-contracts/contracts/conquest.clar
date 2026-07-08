;; conquest.clar
;; Faction-based territory control system
;; 24-hour rounds, merkle-proof crown claims

(define-constant ROUND_DURATION u1440)

(define-data-var authority principal tx-sender)
(define-data-var current-round uint u0)
(define-data-var round-start-height uint u0)

(define-map cells { x: int, y: int } {
  faction: uint,
  score: uint
})

(define-map round-leaderboard uint (buff 32))
(define-map round-ended uint bool)

(define-private (emit-place-stub (x int) (y int) (faction uint) (qty uint) (new-score uint))
  (print {
    event: "place-stub",
    x: x,
    y: y,
    faction: faction,
    qty: qty,
    new_score: new-score
  })
)

(define-private (emit-round-settled (round-id uint) (leaderboard-root (buff 32)))
  (print {
    event: "round-settled",
    round_id: round-id,
    leaderboard_root: leaderboard-root
  })
)

(define-private (emit-crown-claimed (round-id uint) (claimer principal) (faction uint))
  (print {
    event: "crown-claimed",
    round_id: round-id,
    claimer: claimer,
    faction: faction
  })
)

;; Get current round ID
(define-read-only (get-current-round)
  (var-get current-round)
)

(define-private (ensure-round-started)
  (if (is-eq (var-get round-start-height) u0)
    (var-set round-start-height stacks-block-height)
    true
  )
)

;; Check if round window is open
(define-read-only (is-round-active)
  (let ((start (var-get round-start-height)))
    (if (is-eq start u0)
      false
      (< (- stacks-block-height start) ROUND_DURATION)
    )
  )
)

;; Get cell state
(define-read-only (get-cell (x int) (y int))
  (map-get? cells { x: x, y: y })
)

;; Place faction stub (burns stub token, increments score)
(define-public (place-stub (x int) (y int) (faction-stub-token-id uint) (qty uint))
  (begin
    (ensure-round-started)
    (asserts! (is-round-active) (err u1))
    (asserts! (> qty u0) (err u2))
    (try! (contract-call? .items-sft burn faction-stub-token-id qty))
    (let ((current-cell (default-to { faction: u0, score: u0 } (map-get? cells { x: x, y: y }))))
      (let ((new-score (+ (get score current-cell) qty)))
        (map-set cells { x: x, y: y } {
          faction: faction-stub-token-id,
          score: new-score
        })
        (emit-place-stub x y faction-stub-token-id qty new-score)
        (ok true)
      )
    )
  )
)

;; Settle round: compute leaderboard, store root, unlock claims
(define-public (settle-round (round-id uint) (leaderboard-root (buff 32)))
  (begin
    (asserts! (not (is-round-active)) (err u3))
    (asserts! (is-none (map-get? round-ended round-id)) (err u4))
    (map-set round-leaderboard round-id leaderboard-root)
    (map-set round-ended round-id true)
    (var-set current-round (+ round-id u1))
    (var-set round-start-height stacks-block-height)
    (emit-round-settled round-id leaderboard-root)
    (ok true)
  )
)

;; Claim crown after round settles (merkle proofs ship in a later upgrade)
(define-public (claim-crown (round-id uint) (faction uint))
  (begin
    (asserts! (is-some (map-get? round-leaderboard round-id)) (err u6))
    (emit-crown-claimed round-id tx-sender faction)
    (ok true)
  )
)

;; Admin: set authority
(define-public (set-authority (new-authority principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u7))
    (var-set authority new-authority)
    (ok true)
  )
)

(ok true)
