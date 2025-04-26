export const sanitizeUserOutput = (user) => {
    if (!user) return null;
    const output = user.toObject ? user.toObject() : { ...user };

    delete output.password_hash;
    delete output.access_tokens;
    delete output.__v;
    delete output.is_deleted;
    // delete output.registration_date;
    // delete output.createdAt;
    // delete output.updatedAt;

    return output;
};