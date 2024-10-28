
        // Obtén el elemento del título del producto
        const productTitle = document.getElementById('product-title');

        // Divide el título en palabras
        const words = productTitle.innerText.split(' ');

        // Elimina el contenido actual del elemento
        productTitle.innerHTML = '';

        // Aplica colores a cada palabra y agrega al elemento
        words.forEach((word, index) => {
            let colorClass;
            switch (index % 3) {
                case 0:
                    colorClass = 'custom-green';
                    break;
                case 1:
                    colorClass = 'custom-blue';
                    break;
                case 2:
                    colorClass = 'custom-violet';
                    break;
                default:
                    colorClass = '';
            }
            const span = document.createElement('span');
            span.innerText = word;
            span.classList.add(colorClass, `anim_${index + 1}`);
            productTitle.appendChild(span);
            // Agrega un espacio entre las palabras
            if (index < words.length - 1) {
                productTitle.appendChild(document.createTextNode(' '));
            }
        });
