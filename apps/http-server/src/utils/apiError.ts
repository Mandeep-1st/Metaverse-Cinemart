class ApiError extends Error {

    statusCode: number;
    data: null;
    success: boolean;
    errors: unknown[];


    //In js , using this create variable for the classes
    constructor(
        statusCode: number,
        message = "Something Went Wrong",
        errors: unknown[] = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };

/**
 * how to use
 * throw new ApiError(401, "Unauthorized");
 *  */


