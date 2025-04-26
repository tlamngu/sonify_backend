export const sendSuccess = (res, statusCode, data, message = 'Success') => {
    res.status(statusCode).json({
        success: true,
        message,
        data: data || null,
    });
};

export const sendError = (
    res,
    statusCode,
    message = 'An error occurred',
    errors = null
) => {
    res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
    });
};