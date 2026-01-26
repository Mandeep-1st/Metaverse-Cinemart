class ApiResponse<T = unknown> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;

    constructor(
        statusCode: number,
        data: T,
        message: string = "Success"
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };


/**
 * How you should use
 * res.status(200).json(
 *  new ApiResponse(200,{user},"Fetched User")
 * )
 */