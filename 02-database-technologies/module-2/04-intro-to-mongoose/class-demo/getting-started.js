// getting-started.js
const mongoose = require('mongoose');
mongoose.set('debug', true);

main()
    .catch(err => {
        if (err.name == 'ValidationError') {
            console.error(`Mongoose Error: ${err.message}`);
        } else {
            console.error(err);
        }

    })
    .finally(() => mongoose.disconnect());

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/pets');

    const kittySchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        weight: {
            type: Number,
            min: [0, 'Must be a positive number'],
            required: true
        },
        allergies: [String],
        meta: mongoose.Schema.Types.Mixed
    }, { timestamps: true });

    kittySchema.statics.findByName = function (name) {
        return this.find({ name: new RegExp(name, 'i') }).select('name weight');
    };

    const Kitten = mongoose.model('Kitten', kittySchema);

    await Kitten.deleteMany()

    const flufster = new Kitten({ name: 'Fluffster', weight: 12, allergies: ['Milk', 'Kibbles'], meta: { hardLife: true } });

    const fluffy = new Kitten({
        name: 'Fluffy', weight: 5, meta: {
            chadStatus: 'confirmed',
            estimatedLifespan: 100,
            heirlooms: ['Sword of Gilgamesh', 'Mask of devotion', 'Players manual for DND 5e']
        }
    });

    await Kitten.bulkSave([flufster, fluffy])


    const result = await Kitten.find

    console.log(result);
    


}