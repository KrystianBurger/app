import struct

def create_png(width, height, color):
    def write_chunk(f, chunk_type, data):
        f.write(struct.pack('>I', len(data)))
        f.write(chunk_type)
        f.write(data)
        crc = 0xffffffff
        for byte in chunk_type + data:
            if isinstance(byte, str):
                byte = ord(byte)
            crc ^= byte
            for _ in range(8):
                if crc & 1:
                    crc = (crc >> 1) ^ 0xedb88320
                else:
                    crc >>= 1
        f.write(struct.pack('>I', crc ^ 0xffffffff))

    with open(f'{color[1:]}.png', 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        
        # IHDR chunk
        ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        write_chunk(f, b'IHDR', ihdr)
        
        # IDAT chunk with simple colored rectangle
        if color == '#2563EB':  # Blue
            pixel_data = b'\x25\x63\xEB' * width
        else:  # Transparent
            pixel_data = b'\x00\x00\x00' * width
            
        image_data = b''
        for y in range(height):
            image_data += b'\x00' + pixel_data
        
        import zlib
        compressed = zlib.compress(image_data)
        write_chunk(f, b'IDAT', compressed)
        
        # IEND chunk
        write_chunk(f, b'IEND', b'')

create_png(32, 32, '#2563EB')
print("Basic PNG created")
