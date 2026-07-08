;; traits.clar - SIP trait definitions for Beratheon

(define-trait nft-trait
  (
    (get-last-token-id () (response uint uint))
    (get-token-uri (uint) (response (optional (string-ascii 256)) uint))
    (get-owner (uint) (response (optional principal) uint))
    (transfer (uint principal principal) (response bool uint))
  )
)

(define-trait ft-trait
  (
    (transfer (uint principal principal) (response bool uint))
    (get-name () (response (optional (string-ascii 32)) uint))
    (get-symbol () (response (optional (string-ascii 10)) uint))
    (get-decimals () (response (optional uint) uint))
    (get-balance (principal) (response (optional uint) uint))
    (get-total-supply () (response (optional uint) uint))
  )
)

(define-trait sft-trait
  (
    (transfer (uint uint principal principal) (response bool uint))
    (get-balance (uint principal) (response (optional uint) uint))
    (get-overall-balance (principal) (response (optional uint) uint))
    (get-total-supply (uint) (response (optional uint) uint))
  )
)

(define-trait game-authority-trait
  (
    (is-authority (principal) (response bool uint))
  )
)

(ok true)
