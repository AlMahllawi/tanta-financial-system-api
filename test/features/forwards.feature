Feature: Forwards Management
  As a transaction participant
  I want to process transaction forwards
  So that they can go through proper channels and be resolved

  Scenario: Forward valid active transaction
    Given the transaction is valid
    And a target user is clearly specified
    And the forward is done by the latest receiver
    When the forward operates successfully
    Then the system returns response 201

  Scenario: Prevent forwarding finished transactions
    Given the transaction has been finalized
    When the forward is attempted
    Then the user returns a 403 error

  Scenario: Prevent forwarding by an intermediate user
    Given the request is done by someone other than the last receiver
    When the forward is executed
    Then the system halts the forwarding with a 403 error

  Scenario: Forward non-existent transaction or sender
    Given the transaction or sender cannot be found
    When the forward happens
    Then the system returns 404

  Scenario: List multiple forwards for transaction
    Given a valid transaction name exists
    And there are established forwards
    When all forwards are searched
    Then the list is presented ordered by date
    And the system returns response 200

  Scenario: Show empty forwards list
    Given a valid transaction name exists
    But there are no established forwards
    When all forwards are searched
    Then the system returns an empty list
    And the system returns response 200

  Scenario: Fetch valid specific forward
    Given the transaction name is correct
    When the specific forward is examined
    Then the associated tracking and status data is displayed
    And the user is able to view forward details
    And the system returns response 200

  Scenario: Fetch non-existent forward transaction
    Given the transaction is not documented or missing
    When the specific forward is searched
    Then the system returns 404

  Scenario: Provide valid forward response
    Given the response type is either approved, rejected, or waiting review
    And the user has not placed a previous reply
    When the response is given manually
    Then the success triggers properly
    And the system returns response 201

  Scenario: Preventing multiple identical responses
    Given the user attempts to reply for a second time
    When the response validation checks
    Then the system rejects double replies

  Scenario: Response to an invalid transaction
    Given the transaction isn't valid or is missing
    When the procedure runs
    Then the system returns 404

  Scenario: Reverting an active forward that has not been replied to
    Given a valid request has been chosen
    And the destination user has not responded yet
    When the undo option is accessed
    Then the forward is reverted correctly
    And the system returns response 200

  Scenario: Stopping an undo after reply
    Given a valid request has been replied to
    When the undo is checked
    Then the undo option returns a 403 action forbidden

  Scenario: Undo transaction invalid missing
    Given the chosen transaction cannot be established
    When the undo tries to roll back
    Then the system replies 404

  Scenario: Target receiver not found
    Given a target user is specified
    When the receiver user ID does not exist
    Then the system returns 404

  Scenario: Unauthorized forward action by non-creator
    Given an action requires transaction creator privileges
    When a non-creator attempts the action
    Then the system returns 403

  Scenario: Unauthorized undo by non-sender
    Given a forward has been sent
    When a user other than the sender attempts to undo it
    Then the system returns 403

  Scenario: Unauthorized reply by non-receiver
    Given a forward is awaiting a reply
    When a user other than the receiver attempts to reply
    Then the system returns 403

  Scenario: Action on already seen forward
    Given the forward has already been seen by the receiver
    When an update requiring unseen status is attempted
    Then the system returns 403

  Scenario: Update non-existent forward
    Given the forward does not exist
    When the sender attempts to update the forward comment
    Then the system returns 404

  Scenario: Update response on non-existent forward
    Given the forward does not exist for response update
    When the receiver attempts to update the response
    Then the system returns 404
