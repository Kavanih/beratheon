;; game-registry.clar
;; System contract registry for upgradeability
;; FE resolves current system principal via this contract before signing

(define-constant SYSTEM_MARKETPLACE u1)
(define-constant SYSTEM_CRAFTING u2)
(define-constant SYSTEM_CONQUEST u3)
(define-constant SYSTEM_ECHOES u4)
(define-constant SYSTEM_GAME_AUTHORITY u5)

(define-data-var authority principal tx-sender)

(define-map systems uint principal)

;; Get current system principal by ID
(define-read-only (get-system (system-id uint))
  (map-get? systems system-id)
)

;; Register or update system principal
(define-public (set-system (system-id uint) (principal principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u1))
    (map-set systems system-id principal)
    (print {
      event: "system-registered",
      system_id: system-id,
      principal: principal
    })
    (ok true)
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
