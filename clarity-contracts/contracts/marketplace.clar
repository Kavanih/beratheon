;; marketplace.clar
;; On-chain order book for items-sft, cub-nft, username-nft
;; Fee model: 250 bps (juiced) / 1000 bps (unjuiced)
;; Listings escrow SIP-013 balances in this contract until buy or cancel.

(define-constant FEE_BPS_JUICED u250)
(define-constant FEE_BPS_UNJUICED u1000)
(define-constant BPS_DENOMINATOR u10000)

(define-data-var authority principal tx-sender)
(define-data-var treasury principal tx-sender)
(define-data-var listing-counter uint u0)

(define-map listings uint {
  seller: principal,
  token-contract: principal,
  token-id: uint,
  qty: uint,
  price-per-unit-ustx: uint,
  expires-at: uint
})

(define-map listing-active uint bool)

(define-private (emit-list (listing-id uint) (seller principal) (token-contract principal) (token-id uint) (qty uint) (price uint) (expires-at uint))
  (print {
    event: "list",
    listing_id: listing-id,
    seller: seller,
    token_contract: token-contract,
    token_id: token-id,
    qty: qty,
    price_per_unit_ustx: price,
    expires_at: expires-at
  })
)

(define-private (emit-buy (listing-id uint) (buyer principal) (qty uint) (total-price uint))
  (print {
    event: "buy",
    listing_id: listing-id,
    buyer: buyer,
    qty: qty,
    total_price: total-price
  })
)

(define-private (emit-cancel (listing-id uint) (seller principal))
  (print {
    event: "cancel",
    listing_id: listing-id,
    seller: seller
  })
)

;; Escrow SFT from seller into this contract (tx-sender must be seller).
(define-private (escrow-sft (token-contract principal) (token-id uint) (amount uint))
  (contract-call? token-contract transfer token-id amount tx-sender (as-contract tx-sender))
)

;; Release escrowed SFT from this contract to recipient.
(define-private (release-sft (token-contract principal) (token-id uint) (amount uint) (recipient principal))
  (as-contract (contract-call? token-contract transfer token-id amount tx-sender recipient))
)

;; Create a listing (escrows items-sft qty into marketplace)
(define-public (create-listing (token-contract principal) (token-id uint) (qty uint) (price-per-unit-ustx uint) (expires-at uint))
  (begin
    (asserts! (> qty u0) (err u1))
    (asserts! (> price-per-unit-ustx u0) (err u2))
    (asserts! (> expires-at stacks-block-height) (err u3))
    (try! (escrow-sft token-contract token-id qty))
    (let ((new-id (+ (var-get listing-counter) u1)))
      (var-set listing-counter new-id)
      (map-set listings new-id {
        seller: tx-sender,
        token-contract: token-contract,
        token-id: token-id,
        qty: qty,
        price-per-unit-ustx: price-per-unit-ustx,
        expires-at: expires-at
      })
      (map-set listing-active new-id true)
      (emit-list new-id tx-sender token-contract token-id qty price-per-unit-ustx expires-at)
      (ok new-id)
    )
  )
)

;; Cancel a listing (returns escrowed items to seller)
(define-public (cancel (listing-id uint))
  (begin
    (let ((listing (map-get? listings listing-id)))
      (match listing
        l (begin
          (asserts! (is-eq tx-sender (get seller l)) (err u4))
          (asserts! (is-some (map-get? listing-active listing-id)) (err u5))
          (try! (release-sft (get token-contract l) (get token-id l) (get qty l) tx-sender))
          (map-set listing-active listing-id false)
          (emit-cancel listing-id tx-sender)
          (ok true)
        )
        (err u6)
      )
    )
  )
)

;; Buy from a listing (STX to seller + fee; escrowed items to buyer)
(define-public (buy (listing-id uint) (qty uint) (is-juiced bool))
  (begin
    (let ((listing (map-get? listings listing-id)))
      (match listing
        l (begin
          (asserts! (is-some (map-get? listing-active listing-id)) (err u5))
          (asserts! (> qty u0) (err u11))
          (asserts! (<= qty (get qty l)) (err u7))
          (asserts! (< stacks-block-height (get expires-at l)) (err u8))
          (let (
            (total-price (* qty (get price-per-unit-ustx l)))
            (fee-bps (if is-juiced FEE_BPS_JUICED FEE_BPS_UNJUICED))
            (fee-amount (/ (* total-price fee-bps) BPS_DENOMINATOR))
            (remaining (- (get qty l) qty))
            (token-contract (get token-contract l))
            (token-id (get token-id l))
          )
            (try! (stx-transfer? total-price tx-sender (get seller l)))
            (try! (stx-transfer? fee-amount (get seller l) (var-get treasury)))
            (try! (release-sft token-contract token-id qty tx-sender))
            (if (is-eq remaining u0)
              (map-set listing-active listing-id false)
              (map-set listings listing-id (merge l { qty: remaining }))
            )
            (emit-buy listing-id tx-sender qty total-price)
            (ok true)
          )
        )
        (err u6)
      )
    )
  )
)

;; Buy from multiple listings (bulk fill)
(define-public (buy-many (fills (list 100 { listing-id: uint, qty: uint, is-juiced: bool })))
  (begin
    (asserts! (> (len fills) u0) (err u9))
    (fold buy-one fills (ok u0))
  )
)

(define-private (buy-one (fill { listing-id: uint, qty: uint, is-juiced: bool }) (result (response uint uint)))
  (match result
    ok-val (match (buy (get listing-id fill) (get qty fill) (get is-juiced fill))
      ok-buy (ok (+ ok-val u1))
      err-buy (err err-buy)
    )
    err-val (err err-val)
  )
)

;; Get listing details
(define-read-only (get-listing (listing-id uint))
  (map-get? listings listing-id)
)

;; Check if listing is active
(define-read-only (is-listing-active (listing-id uint))
  (is-some (map-get? listing-active listing-id))
)

;; Admin: set authority
(define-public (set-authority (new-authority principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u10))
    (var-set authority new-authority)
    (ok true)
  )
)

;; Admin: set treasury
(define-public (set-treasury (new-treasury principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u10))
    (var-set treasury new-treasury)
    (ok true)
  )
)

(ok true)
