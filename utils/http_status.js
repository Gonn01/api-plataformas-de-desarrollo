/**
 * Códigos de estado HTTP. Usalos siempre en vez del número mágico:
 * `res.status(HttpStatus.CREATED)` en vez de `res.status(201)`.
 */
export const HttpStatus = Object.freeze({
    OK:                    200,
    CREATED:               201,
    NO_CONTENT:            204,

    BAD_REQUEST:           400,
    UNAUTHORIZED:          401,
    FORBIDDEN:             403,
    NOT_FOUND:             404,
    CONFLICT:              409,
    UNPROCESSABLE_ENTITY:  422,

    INTERNAL_SERVER_ERROR: 500,
});
