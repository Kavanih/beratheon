;; crafting.clar
;; Recipe registry and crafting system
;; Supports alchemy, workbench, and honing stations

(define-constant STATION_ALCHEMY u1)
(define-constant STATION_WORKBENCH u2)
(define-constant STATION_HONE u3)

(define-data-var authority principal tx-sender)
(define-data-var recipe-counter uint u0)

(define-map recipes uint {
  inputs: (list 10 { token-id: uint, qty: uint }),
  outputs: (list 10 { token-id: uint, qty: uint }),
  station: uint,
  xp-kind: uint,
  xp-amt: uint,
  enabled: bool
})

(define-map player-xp { player: principal, kind: uint } uint)

(define-private (emit-craft (recipe-id uint) (crafter principal) (inputs (list 10 { token-id: uint, qty: uint })) (outputs (list 10 { token-id: uint, qty: uint })))
  (print {
    event: "craft",
    recipe_id: recipe-id,
    crafter: crafter,
    inputs: inputs,
    outputs: outputs
  })
)

(define-private (emit-xp-gain (player principal) (kind uint) (amount uint))
  (print {
    event: "xp-gain",
    player: player,
    kind: kind,
    amount: amount
  })
)

;; Register a new recipe
(define-public (register-recipe
  (inputs (list 10 { token-id: uint, qty: uint }))
  (outputs (list 10 { token-id: uint, qty: uint }))
  (station uint)
  (xp-kind uint)
  (xp-amt uint)
)
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u1))
    (asserts! (and (>= station u1) (<= station u3)) (err u2))
    (asserts! (> (len inputs) u0) (err u3))
    (asserts! (> (len outputs) u0) (err u4))
    (let ((new-id (+ (var-get recipe-counter) u1)))
      (var-set recipe-counter new-id)
      (map-set recipes new-id {
        inputs: inputs,
        outputs: outputs,
        station: station,
        xp-kind: xp-kind,
        xp-amt: xp-amt,
        enabled: true
      })
      (ok new-id)
    )
  )
)

;; Craft: burn inputs, grant outputs, credit XP
(define-public (craft (recipe-id uint))
  (begin
    (let ((recipe (map-get? recipes recipe-id)))
      (match recipe
        r (begin
          (asserts! (get enabled r) (err u5))
          (try! (fold burn-craft-input (get inputs r) (ok true)))
          (try! (fold grant-craft-output (get outputs r) (ok true)))
          (let ((current-xp (default-to u0 (map-get? player-xp { player: tx-sender, kind: (get xp-kind r) }))))
            (map-set player-xp { player: tx-sender, kind: (get xp-kind r) } (+ current-xp (get xp-amt r)))
            (emit-xp-gain tx-sender (get xp-kind r) (get xp-amt r))
          )
          (emit-craft recipe-id tx-sender (get inputs r) (get outputs r))
          (ok true)
        )
        (err u6)
      )
    )
  )
)

(define-private (burn-craft-input (item { token-id: uint, qty: uint }) (result (response bool uint)))
  (match result
    ok-val (contract-call? .items-sft burn (get token-id item) (get qty item))
    err-val (err err-val)
  )
)

(define-private (grant-craft-output (item { token-id: uint, qty: uint }) (result (response bool uint)))
  (match result
    ok-val (contract-call? .items-sft mint (get token-id item) tx-sender (get qty item))
    err-val (err err-val)
  )
)

;; Get recipe details
(define-read-only (get-recipe (recipe-id uint))
  (map-get? recipes recipe-id)
)

;; Get player XP for a kind
(define-read-only (get-player-xp (player principal) (kind uint))
  (default-to u0 (map-get? player-xp { player: player, kind: kind }))
)

;; Disable a recipe
(define-public (disable-recipe (recipe-id uint))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u1))
    (let ((recipe (map-get? recipes recipe-id)))
      (match recipe
        r (begin
          (map-set recipes recipe-id (merge r { enabled: false }))
          (ok true)
        )
        (err u6)
      )
    )
  )
)

;; Admin: set authority
(define-public (set-authority (new-authority principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u1))
    (var-set authority new-authority)
    (ok true)
  )
)

(ok true)
