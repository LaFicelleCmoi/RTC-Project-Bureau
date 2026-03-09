-- TES TABLES EXISTANTES
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    phone_number TEXT,
    mail TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE Servers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    owner BIGINT NOT NULL REFERENCES users(id),
    invitecode TEXT NOT NULL
);  

CREATE TABLE users_servers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    server_id BIGINT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,

    UNIQUE (user_id, server_id)
);

CREATE TABLE channels (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    server_id BIGINT NOT NULL,

    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);


CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id BIGINT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP 
);


CREATE TABLE reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);


CREATE TABLE private_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);


CREATE TABLE server_bans (
    id BIGSERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by BIGINT NOT NULL REFERENCES users(id),
    reason TEXT,
    expires_at TIMESTAMP NULL 
);