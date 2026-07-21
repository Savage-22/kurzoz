class DomainError extends Error {
    constructor(message, status) {
        super(message)
        this.name = this.constructor.name
        this.status = status
    }
}

export class ValidationError extends DomainError {
    constructor(message, errors = []) {
        super(message, 400)
        this.errors = errors
    }
}

export class UnauthorizedError extends DomainError {
    constructor(message) {
        super(message, 401)
    }
}

export class ForbiddenError extends DomainError {
    constructor(message) {
        super(message, 403)
    }
}

export class NotFoundError extends DomainError {
    constructor(message) {
        super(message, 404)
    }
}

export class ConflictError extends DomainError {
    constructor(message) {
        super(message, 409)
    }
}
